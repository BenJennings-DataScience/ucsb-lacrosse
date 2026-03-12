import * as cheerio from 'cheerio';
import { syncScheduleToSupabase, syncRosterToSupabase, syncStatsToSupabase } from './supabaseSync';

export interface Game {
  day: string;
  month: string;
  date: string;
  opponent: string;
  isAway: boolean;
  time: string;
  venue: string;
  gameType: string;
  result: string | null;
  score: string | null;
  statsUrl: string | null;
}

export interface ScheduleData {
  record: {
    overall: string;
    division: string;
    streak: string;
    home: string;
    away: string;
  };
  games: Game[];
}

export interface FieldPlayer {
  slug: string;
  jersey: string;
  name: string;
  position: string;
  eligibility: string;
  gp: string;
  goals: string;
  assists: string;
  points: string;
  shots: string;
  groundBalls: string;
  penalties: string;
  turnovers: string;
  faceoffWins: string;
  faceoffLosses: string;
}

export interface Goalie {
  slug: string;
  jersey: string;
  name: string;
  eligibility: string;
  gp: string;
  goalsAgainst: string;
  saves: string;
  savePct: string;
  goals: string;
  assists: string;
}

export interface StatsData {
  fieldPlayers: FieldPlayer[];
  goalies: Goalie[];
}

export interface RosterPlayer {
  slug: string;
  name: string;
  jersey: string;
  position: string;
  classYear: string;
  eligibility: string;
  height: string;
  weight: string;
  hometown: string;
  hometownCity: string;
  hometownState: string;
  photoUrl: string | null;
}

export interface GameLogEntry {
  date: string;
  opponent: string;
  result: string;
  played: boolean;
  groundBalls: string;
  shots: string;
  goals: string;
  assists: string;
  saves: string;
  faceoffWins: string;
  faceoffLosses: string;
  wl: 'W' | 'L' | null; // resolved from schedule page — single source of truth
}

export interface PlayerProfile {
  slug: string;
  name: string;
  jersey: string;
  position: string;
  classYear: string;
  eligibility: string;
  height: string;
  weight: string;
  hometown: string;
  photoUrl: string | null;
  gameLog: GameLogEntry[];
}

const FETCH_OPTS = {
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UCSB-Dashboard/1.0)' },
};

// Strip leading @, poll rankings (#17), and extra whitespace for fuzzy matching
function normalizeOpponent(name: string): string {
  return name.replace(/^@\s*/, '').replace(/#\d+\s*/g, '').trim().toLowerCase();
}

// ─── Simple in-process cache ────────────────────────────────────────────────
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let scheduleCache: { data: ScheduleData; ts: number } | null = null;
let statsCache: { data: StatsData; ts: number } | null = null;
let rosterCache: { data: RosterPlayer[]; ts: number } | null = null;
const playerProfileCache = new Map<string, { data: PlayerProfile; ts: number }>();

// ─── Schedule ────────────────────────────────────────────────────────────────
export async function fetchSchedule(): Promise<ScheduleData> {
  if (scheduleCache && Date.now() - scheduleCache.ts < CACHE_TTL) {
    return scheduleCache.data;
  }

  const res = await fetch('https://mcla.us/teams/uc-santa-barbara/2026/schedule', FETCH_OPTS);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Season record
  const recordRow = $('#team-schedule-snapshot table tr:not(.main-header)').first();
  const cells = recordRow.find('td');
  const record = {
    overall: $(cells[0]).text().trim() || '0 - 0',
    division: $(cells[2]).text().trim() || '0 - 0',
    streak: $(cells[4]).text().trim() || '0 - 0',
    home: $(cells[5]).text().trim() || '0 - 0',
    away: $(cells[6]).text().trim() || '0 - 0',
  };

  // Game tiles
  const games: Game[] = [];
  $('.game-opponent-tile').each((_, el) => {
    const tile = $(el);
    const dateParts = tile.find('.game-opponent-tile__date p');
    const opponentName = tile.find('.opponent__name');
    const rawText = opponentName.text().trim();
    const scoreEl = tile.find('.game-opponent-tile__score');

    games.push({
      day: $(dateParts[0]).text().trim(),
      month: $(dateParts[1]).text().trim(),
      date: $(dateParts[2]).text().trim(),
      opponent: opponentName.find('a').text().trim(),
      isAway: rawText.startsWith('@'),
      time: tile.find('.game-opponent-tile__time').text().replace(/\s+/g, ' ').trim(),
      venue: tile.find('.game-opponent-tile__venue a').text().trim() ||
        tile.find('.game-opponent-tile__venue').text().replace(/\s+/g, ' ').trim(),
      gameType: tile.find('.game-opponent-tile__type').text().trim(),
      result: scoreEl.find('.outcome').text().trim() || null,
      score: scoreEl.find('.score').text().trim() || null,
      statsUrl: tile.find('.game-opponent-tile__score-cta').attr('href') ?? null,
    });
  });

  const data: ScheduleData = { record, games };
  scheduleCache = { data, ts: Date.now() };
  // Persist to Supabase asynchronously — don't block the API response
  syncScheduleToSupabase(data).catch((err) =>
    console.error('[Supabase sync] schedule:', err)
  );
  return data;
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export async function fetchStats(): Promise<StatsData> {
  if (statsCache && Date.now() - statsCache.ts < CACHE_TTL) {
    return statsCache.data;
  }

  const res = await fetch('https://mcla.us/teams/uc-santa-barbara/2026/stats', FETCH_OPTS);
  const html = await res.text();
  const $ = cheerio.load(html);

  const fieldPlayers: FieldPlayer[] = [];
  const goalies: Goalie[] = [];

  $('.stats-table').each((_, tableEl) => {
    const table = $(tableEl);
    const headerText = table.find('thead th').map((_, th) => $(th).text()).get().join(' ');
    const isGoalie = /GA|Goals against|Saves/i.test(headerText);

    table.find('tbody tr').each((_, row) => {
      const tds = $(row).find('td');
      const playerLink = $(tds[1]).find('a[href*="/players/"]');
      if (!playerLink.length) return;

      const href = playerLink.attr('href') || '';
      const slug = href.replace('/players/', '');

      const jersey = $(tds[0]).text().trim();
      const name = playerLink.text().trim();
      const position = $(tds[1]).find('.position').text().trim();

      if (isGoalie) {
        goalies.push({
          slug,
          jersey,
          name,
          eligibility: $(tds[2]).text().trim(),
          gp: $(tds[3]).text().trim(),
          goalsAgainst: $(tds[4]).text().trim(),
          saves: $(tds[5]).text().trim(),
          savePct: $(tds[6]).text().trim(),
          goals: $(tds[7]).text().trim(),
          assists: $(tds[8]).text().trim(),
        });
      } else {
        fieldPlayers.push({
          slug,
          jersey,
          name,
          position,
          eligibility: $(tds[2]).text().trim(),
          gp: $(tds[3]).text().trim(),
          goals: $(tds[4]).text().trim(),
          assists: $(tds[5]).text().trim(),
          points: $(tds[6]).text().trim(),
          shots: $(tds[7]).text().trim(),
          groundBalls: $(tds[8]).text().trim(),
          penalties: $(tds[9]).text().trim(),
          turnovers: $(tds[10]).text().trim(),
          faceoffWins: $(tds[11]).text().trim(),
          faceoffLosses: $(tds[12]).text().trim(),
        });
      }
    });
  });

  fieldPlayers.sort((a, b) => (parseInt(b.points) || 0) - (parseInt(a.points) || 0));

  const data: StatsData = { fieldPlayers, goalies };
  statsCache = { data, ts: Date.now() };
  // Persist to Supabase asynchronously — don't block the API response
  syncStatsToSupabase(data).catch((err) =>
    console.error('[Supabase sync] stats:', err)
  );
  return data;
}

// ─── Roster ──────────────────────────────────────────────────────────────────
export async function fetchRoster(): Promise<RosterPlayer[]> {
  if (rosterCache && Date.now() - rosterCache.ts < CACHE_TTL) {
    return rosterCache.data;
  }

  const res = await fetch('https://mcla.us/teams/uc-santa-barbara/2026/roster', FETCH_OPTS);
  const html = await res.text();
  const $ = cheerio.load(html);

  const players: RosterPlayer[] = [];

  $('.player-tile').each((_, el) => {
    const tile = $(el);

    // Extract slug from href
    const headshotLink = tile.find('.player-tile__headshot a');
    const href = headshotLink.attr('href') || '';
    const slug = href.replace('/players/', '');

    // Extract photo URL
    const img = tile.find('.player-tile__headshot img');
    const photoUrl = img.attr('src') || null;

    // Extract name and jersey from name element
    // Format: "17\n      Nathaniel Alim"
    const nameRaw = tile.find('.player-tile__name').text();
    const nameParts = nameRaw.split('\n').map((s) => s.trim()).filter(Boolean);
    const jersey = nameParts[0] || '';
    const name = nameParts.slice(1).join(' ').trim() || nameParts[0] || '';

    // Extract meta: [0]=position, [1]=classYear, [2]=eligibility, [3]=height, [4]=weight
    const metaItems = tile.find('.player-tile__meta p');
    const position = $(metaItems[0]).text().trim();
    const classYear = $(metaItems[1]).text().trim();
    const eligibility = $(metaItems[2]).text().trim();
    const height = $(metaItems[3]).text().trim();
    const weight = $(metaItems[4]).text().trim();

    // Extract hometown
    const hometown = tile.find('.player-tile__location').text().trim();
    const hometownParts = hometown.split(',').map((s) => s.trim());
    const hometownCity = hometownParts[0] || '';
    const hometownState = hometownParts[1] || '';

    if (!slug) return;

    players.push({
      slug,
      name,
      jersey,
      position,
      classYear,
      eligibility,
      height,
      weight,
      hometown,
      hometownCity,
      hometownState,
      photoUrl,
    });
  });

  rosterCache = { data: players, ts: Date.now() };
  // Persist to Supabase asynchronously — don't block the API response
  syncRosterToSupabase(players).catch((err) =>
    console.error('[Supabase sync] roster:', err)
  );
  return players;
}

// ─── Player Profile ───────────────────────────────────────────────────────────
export async function fetchPlayerProfile(slug: string): Promise<PlayerProfile> {
  const cached = playerProfileCache.get(slug);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(`https://mcla.us/players/${slug}`, FETCH_OPTS);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Photo URL
  const photoUrl = $('.player-header img').attr('src') || null;

  // Jersey
  const jersey = $('.player-header__jersey').text().trim();

  // Name
  const name = $('.player-header__name').text().trim();

  // Details: build label → value map
  const detailsMap: Record<string, string> = {};
  $('.player-header__details li').each((_, li) => {
    const label = $(li).find('label').text().trim().toLowerCase();
    const value = $(li).find('span').text().trim();
    if (label) detailsMap[label] = value;
  });

  const position = detailsMap['position'] || detailsMap['pos'] || '';
  const classYear = detailsMap['class'] || detailsMap['year'] || '';
  const height = detailsMap['height'] || detailsMap['ht'] || '';
  const weight = detailsMap['weight'] || detailsMap['wt'] || '';
  const hometown = detailsMap['hometown'] || detailsMap['home'] || '';
  const eligibility = detailsMap['eligibility'] || detailsMap['elig'] || '';

  // Game log: rows are direct children of tbody (not nested)
  const gameLog: GameLogEntry[] = [];
  $('#player__stats-by-game tbody tr').each((_, row) => {
    const tds = $(row).find('td');
    if (!tds.length) return;

    const getCellText = (idx: number) => $(tds[idx]).find('.value').text().trim() || $(tds[idx]).text().trim();

    const date = getCellText(0);
    const opponent = getCellText(1);
    const result = getCellText(2);
    const gpVal = getCellText(3);
    const played = ['1', 'y', 'yes', 'true'].includes(gpVal.toLowerCase());

    gameLog.push({
      date,
      opponent,
      result,
      played,
      groundBalls: getCellText(4),
      shots: getCellText(5),
      goals: getCellText(6),
      assists: getCellText(7),
      saves: getCellText(8),
      faceoffWins: getCellText(9),
      faceoffLosses: getCellText(10),
      wl: null, // resolved below
    });
  });

  // Resolve W/L from the schedule page — that's the authoritative source
  try {
    const schedule = await fetchSchedule();
    for (const entry of gameLog) {
      const entryOpp = normalizeOpponent(entry.opponent);
      const entryDate = entry.date.trim().toLowerCase();
      const match = schedule.games.find((g) => {
        return (
          normalizeOpponent(g.opponent) === entryOpp &&
          `${g.month} ${g.date}`.trim().toLowerCase() === entryDate
        );
      });
      if (match?.result) {
        const first = match.result.trim()[0]?.toUpperCase();
        entry.wl = first === 'W' ? 'W' : first === 'L' ? 'L' : null;
      }
    }
  } catch {
    // schedule fetch failed — wl stays null, no badges shown
  }

  const profile: PlayerProfile = {
    slug,
    name,
    jersey,
    position,
    classYear,
    eligibility,
    height,
    weight,
    hometown,
    photoUrl,
    gameLog,
  };

  playerProfileCache.set(slug, { data: profile, ts: Date.now() });
  return profile;
}

// ─── Polls ────────────────────────────────────────────────────────────────────

export interface PollEntry {
  rank: number;
  team: string;
  teamSlug: string;
  record: string;
  points: number;
  firstPlaceVotes: number;
  prevRank: number;
  change: number;              // absolute spots moved (0 = no change)
  changeDirection: 'up' | 'down' | 'none';
}

export interface PollWeek {
  key: string;   // "week-2"
  label: string; // "Week 2"
}

export interface PollData {
  weekKey: string;
  weekLabel: string;
  availableWeeks: PollWeek[];
  entries: PollEntry[];
}

const pollCache = new Map<string, { data: PollData; ts: number }>();

export async function fetchPolls(weekKey?: string): Promise<PollData> {
  const url = weekKey
    ? `https://mcla.us/polls?division_id=d1&week_key=${weekKey}`
    : 'https://mcla.us/polls?division_id=d1';

  const cacheKey = weekKey ?? '__default__';
  const cached = pollCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const res = await fetch(url, FETCH_OPTS);
  const html = await res.text();
  const $ = cheerio.load(html);

  // ── Available weeks ────────────────────────────────────────────────────────
  const availableWeeks: PollWeek[] = [];
  let activeWeekKey = weekKey ?? 'week-1';
  let activeWeekLabel = '';

  $('.week-selector__stage').closest('a').each((_, el) => {
    const a = $(el);
    const key = a.attr('data-key') ?? '';
    const label = a.find('.stage__label').text().trim();
    if (!key || !label) return;

    // De-duplicate (mcla.us has a duplicate week-5 entry)
    if (!availableWeeks.find((w) => w.key === key)) {
      availableWeeks.push({ key, label });
    }

    if (a.hasClass('active-week')) {
      activeWeekKey = key;
      activeWeekLabel = label;
    }
  });

  if (!activeWeekLabel) {
    activeWeekLabel = availableWeeks.find((w) => w.key === activeWeekKey)?.label ?? activeWeekKey;
  }

  // ── Rankings table ─────────────────────────────────────────────────────────
  const entries: PollEntry[] = [];

  $('table tbody tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 5) return;

    const rank = parseInt($(tds[0]).text().trim()) || 0;
    if (!rank) return;

    // Change cell: <span title="Up from #5" data-uk-icon="icon: triangle-up">2</span>
    const changeSpan = $(tds[1]).find('span');
    const icon = changeSpan.attr('data-uk-icon') ?? '';
    const changeAmt = parseInt(changeSpan.text().trim()) || 0;
    let changeDirection: PollEntry['changeDirection'] = 'none';
    if (icon.includes('triangle-up'))   changeDirection = 'up';
    if (icon.includes('triangle-down')) changeDirection = 'down';

    const prevRank =
      changeDirection === 'up'   ? rank + changeAmt :
      changeDirection === 'down' ? rank - changeAmt :
      rank;

    // Team name & slug
    const teamLink = $(tds[2]).find('a');
    const team = teamLink.text().trim();
    const href = teamLink.attr('href') ?? '';
    // href format: /teams/uc-santa-barbara/2026/schedule
    const teamSlug = href.split('/')[2] ?? '';

    const record = $(tds[3]).text().trim();
    const points = parseInt($(tds[4]).text().trim()) || 0;
    const firstPlaceVotes = parseInt($(tds[5]).text().trim()) || 0;

    entries.push({ rank, team, teamSlug, record, points, firstPlaceVotes, prevRank, change: changeAmt, changeDirection });
  });

  const data: PollData = {
    weekKey: activeWeekKey,
    weekLabel: activeWeekLabel,
    availableWeeks,
    entries,
  };

  pollCache.set(cacheKey, { data, ts: Date.now() });
  // Also cache under the resolved week key
  if (cacheKey === '__default__') pollCache.set(activeWeekKey, { data, ts: Date.now() });

  return data;
}
