/**
 * Supabase persistence layer.
 * Called fire-and-forget from the scraper after every fresh fetch so that
 * we build up historical data over time without blocking API responses.
 */
import { supabase } from './supabase';
import type { ScheduleData, StatsData, RosterPlayer } from './scraper';
import { deriveHometownCoords } from './hometownCoords';

const SEASON_YEAR = 2026;

// Cache season IDs in memory keyed by year
const seasonIdCache = new Map<number, string>();

async function getOrCreateSeason(year = SEASON_YEAR): Promise<string> {
  const cached = seasonIdCache.get(year);
  if (cached) return cached;

  const { data: existing } = await supabase
    .from('seasons')
    .select('id')
    .eq('year', year)
    .maybeSingle();

  if (existing?.id) {
    seasonIdCache.set(year, existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from('seasons')
    .insert({ year })
    .select('id')
    .single();

  if (error) throw error;
  seasonIdCache.set(year, created.id);
  return created.id;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function toIsoDate(month: string, date: string, year: number): string | null {
  const m = MONTH_MAP[month];
  if (!m) return null;
  return `${year}-${m}-${date.padStart(2, '0')}`;
}

function parseScores(score: string | null): { ucsbScore: number | null; opponentScore: number | null } {
  if (!score) return { ucsbScore: null, opponentScore: null };
  const match = score.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!match) return { ucsbScore: null, opponentScore: null };
  return { ucsbScore: parseInt(match[1]), opponentScore: parseInt(match[2]) };
}

// ─── Schedule sync ────────────────────────────────────────────────────────────

export async function syncScheduleToSupabase(data: ScheduleData, year = SEASON_YEAR): Promise<void> {
  const seasonId = await getOrCreateSeason(year);

  // Keep season record (wins/losses) up to date
  const overallMatch = data.record.overall.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (overallMatch) {
    await supabase
      .from('seasons')
      .update({ wins: parseInt(overallMatch[1]), losses: parseInt(overallMatch[2]) })
      .eq('id', seasonId);
  }

  for (const game of data.games) {
    const isoDate = toIsoDate(game.month, game.date, year);
    if (!isoDate) continue;
    if (!game.opponent) continue;

    const { ucsbScore, opponentScore } = parseScores(game.score ?? null);

    let isWin: boolean | null = null;
    if (game.result) {
      const r = game.result.trim().toUpperCase();
      if (r.startsWith('W')) isWin = true;
      else if (r.startsWith('L')) isWin = false;
    }

    const payload = {
      season_id: seasonId,
      date: isoDate,
      opponent: game.opponent,
      is_home: !game.isAway,
      venue: game.venue || null,
      ucsb_score: ucsbScore,
      opponent_score: opponentScore,
      is_win: isWin,
      notes: game.venue || null,
    };

    // Use native upsert — requires the unique constraint:
    // ALTER TABLE games ADD CONSTRAINT games_season_date_opponent_key UNIQUE (season_id, date, opponent);
    const { error } = await supabase
      .from('games')
      .upsert(payload, { onConflict: 'season_id,date,opponent' });

    if (error) console.error('[Supabase sync] game upsert:', game.opponent, isoDate, error.message);
  }
}

// ─── Roster sync ──────────────────────────────────────────────────────────────

export async function syncRosterToSupabase(players: RosterPlayer[]): Promise<void> {
  for (const p of players) {
    const jerseyNum = parseInt(p.jersey) || null;
    const coords = deriveHometownCoords(p.hometown);

    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('name', p.name)
      .maybeSingle();

    const payload = {
      number: jerseyNum,
      position: p.position || null,
      photo_url: p.photoUrl || null,
      hometown: p.hometown || null,
      hometown_city: p.hometownCity || null,
      hometown_state: p.hometownState || null,
      slug: p.slug || null,
      ...(coords ? { hometown_lat: coords.lat, hometown_lng: coords.lng } : {}),
    };

    if (existing?.id) {
      await supabase.from('players').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('players').insert({ name: p.name, ...payload });
    }
  }
}

// ─── Stats sync ───────────────────────────────────────────────────────────────

export async function syncStatsToSupabase(data: StatsData): Promise<void> {
  const seasonId = await getOrCreateSeason();

  type PlayerStat = {
    name: string;
    number: number | null;
    position: string | null;
    goals: number;
    assists: number;
    points: number;
    gamesPlayed: number;
  };

  const allPlayers: PlayerStat[] = [
    ...data.fieldPlayers.map((p) => ({
      name: p.name,
      number: parseInt(p.jersey) || null,
      position: p.position || null,
      goals: parseInt(p.goals) || 0,
      assists: parseInt(p.assists) || 0,
      points: parseInt(p.points) || 0,
      gamesPlayed: parseInt(p.gp) || 0,
    })),
    ...data.goalies.map((p) => ({
      name: p.name,
      number: parseInt(p.jersey) || null,
      position: 'Goalie',
      goals: parseInt(p.goals) || 0,
      assists: parseInt(p.assists) || 0,
      points: (parseInt(p.goals) || 0) + (parseInt(p.assists) || 0),
      gamesPlayed: parseInt(p.gp) || 0,
    })),
  ];

  for (const p of allPlayers) {
    // Resolve player ID (create if new)
    let playerId: string;

    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('name', p.name)
      .maybeSingle();

    if (existing?.id) {
      playerId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('players')
        .insert({ name: p.name, number: p.number, position: p.position })
        .select('id')
        .single();
      if (error) {
        console.error('[Supabase sync] insert player:', p.name, error.message);
        continue;
      }
      playerId = created.id;
    }

    // Upsert season stats in rosters table
    const { data: existingRoster } = await supabase
      .from('rosters')
      .select('id')
      .eq('player_id', playerId)
      .eq('season_id', seasonId)
      .maybeSingle();

    const rosterPayload = {
      player_id: playerId,
      season_id: seasonId,
      goals: p.goals,
      assists: p.assists,
      points: p.points,
      games_played: p.gamesPlayed,
    };

    if (existingRoster?.id) {
      await supabase.from('rosters').update(rosterPayload).eq('id', existingRoster.id);
    } else {
      await supabase.from('rosters').insert(rosterPayload);
    }
  }
}
