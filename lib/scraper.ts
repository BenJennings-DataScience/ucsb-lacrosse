import * as cheerio from 'cheerio';

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

const FETCH_OPTS = {
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UCSB-Dashboard/1.0)' },
};

// ─── Simple in-process cache ────────────────────────────────────────────────
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let scheduleCache: { data: ScheduleData; ts: number } | null = null;
let statsCache: { data: StatsData; ts: number } | null = null;

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

      const jersey = $(tds[0]).text().trim();
      const name = playerLink.text().trim();
      const position = $(tds[1]).find('.position').text().trim();

      if (isGoalie) {
        goalies.push({
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
  return data;
}
