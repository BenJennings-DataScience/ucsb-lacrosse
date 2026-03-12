/**
 * Supabase persistence layer.
 * Called fire-and-forget from the scraper after every fresh fetch so that
 * we build up historical data over time without blocking API responses.
 */
import { supabase } from './supabase';
import type { ScheduleData, StatsData, RosterPlayer } from './scraper';
import { deriveHometownCoords } from './hometownCoords';

const SEASON_YEAR = 2026;

// Cache season ID in memory so we don't query it on every sync call
let cachedSeasonId: string | null = null;

async function getOrCreateSeason(): Promise<string> {
  if (cachedSeasonId) return cachedSeasonId;

  const { data: existing } = await supabase
    .from('seasons')
    .select('id')
    .eq('year', SEASON_YEAR)
    .maybeSingle();

  if (existing?.id) {
    cachedSeasonId = existing.id;
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from('seasons')
    .insert({ year: SEASON_YEAR })
    .select('id')
    .single();

  if (error) throw error;
  cachedSeasonId = created.id;
  return created.id;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function toIsoDate(month: string, date: string): string | null {
  const m = MONTH_MAP[month];
  if (!m) return null;
  return `${SEASON_YEAR}-${m}-${date.padStart(2, '0')}`;
}

function parseScores(score: string | null): { ucsbScore: number | null; opponentScore: number | null } {
  if (!score) return { ucsbScore: null, opponentScore: null };
  const match = score.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!match) return { ucsbScore: null, opponentScore: null };
  return { ucsbScore: parseInt(match[1]), opponentScore: parseInt(match[2]) };
}

// ─── Schedule sync ────────────────────────────────────────────────────────────

export async function syncScheduleToSupabase(data: ScheduleData): Promise<void> {
  const seasonId = await getOrCreateSeason();

  // Keep season record (wins/losses) up to date
  const overallMatch = data.record.overall.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (overallMatch) {
    await supabase
      .from('seasons')
      .update({ wins: parseInt(overallMatch[1]), losses: parseInt(overallMatch[2]) })
      .eq('id', seasonId);
  }

  for (const game of data.games) {
    // Only persist games that have been played
    if (!game.result || !game.score) continue;

    const isoDate = toIsoDate(game.month, game.date);
    if (!isoDate) continue;

    const { ucsbScore, opponentScore } = parseScores(game.score);
    const isWin = game.result.toUpperCase().startsWith('W');

    const { data: existing } = await supabase
      .from('games')
      .select('id')
      .eq('date', isoDate)
      .eq('opponent', game.opponent)
      .maybeSingle();

    const payload = {
      season_id: seasonId,
      date: isoDate,
      opponent: game.opponent,
      is_home: !game.isAway,
      ucsb_score: ucsbScore,
      opponent_score: opponentScore,
      is_win: isWin,
      notes: game.venue || null,
    };

    if (existing?.id) {
      await supabase.from('games').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('games').insert(payload);
    }
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
