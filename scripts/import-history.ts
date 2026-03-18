/**
 * One-time historical import: scrapes UCSB lax schedule pages for 2016-2025
 * and upserts all completed games into Supabase.
 *
 * Usage:
 *   npm run import-history
 *
 * Requires env vars (reads from .env.local automatically):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  ← preferred (bypasses RLS)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  ← fallback if service key not set
 *
 * Run the following SQL in Supabase BEFORE running this script:
 *   ALTER TABLE games ADD COLUMN IF NOT EXISTS venue TEXT;
 *   UPDATE games SET venue = notes WHERE venue IS NULL AND notes IS NOT NULL;
 */

import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// ─── Load env ─────────────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const FETCH_OPTS = {
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UCSB-Dashboard/1.0)' },
};

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

async function scrapeYear(year: number) {
  const url = `https://mcla.us/teams/uc-santa-barbara/${year}/schedule`;
  console.log(`  Fetching ${url}`);
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) {
    console.warn(`  HTTP ${res.status} for ${year} — skipping`);
    return [];
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const games: Array<{
    month: string; date: string; day: string;
    opponent: string; isAway: boolean;
    venue: string; gameType: string;
    result: string | null; score: string | null;
  }> = [];

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
      venue: tile.find('.game-opponent-tile__venue a').text().trim() ||
        tile.find('.game-opponent-tile__venue').text().replace(/\s+/g, ' ').trim(),
      gameType: tile.find('.game-opponent-tile__type').text().trim(),
      result: scoreEl.find('.outcome').text().trim() || null,
      score: scoreEl.find('.score').text().trim() || null,
    });
  });

  // Only return completed games
  return games.filter((g) => g.result && g.opponent);
}

async function getOrCreateSeason(year: number): Promise<string> {
  const { data: existing } = await supabase
    .from('seasons')
    .select('id')
    .eq('year', year)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from('seasons')
    .insert({ year })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create season ${year}: ${error.message}`);
  return created.id;
}

async function importYear(year: number) {
  console.log(`\n[${year}] Scraping...`);
  const games = await scrapeYear(year);
  console.log(`  Found ${games.length} completed games`);

  if (games.length === 0) return;

  const seasonId = await getOrCreateSeason(year);

  // Parse overall record from wins/losses
  const wins = games.filter((g) => g.result?.toUpperCase().startsWith('W')).length;
  const losses = games.filter((g) => g.result?.toUpperCase().startsWith('L')).length;
  await supabase.from('seasons').update({ wins, losses }).eq('id', seasonId);

  let inserted = 0;
  let updated = 0;

  for (const game of games) {
    const isoDate = toIsoDate(game.month, game.date, year);
    if (!isoDate || !game.opponent) continue;

    const { ucsbScore, opponentScore } = parseScores(game.score ?? null);

    const r = (game.result ?? '').trim().toUpperCase();
    const isWin = r.startsWith('W') ? true : r.startsWith('L') ? false : null;

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
      venue: game.venue || null,
      ucsb_score: ucsbScore,
      opponent_score: opponentScore,
      is_win: isWin,
      notes: game.venue || null,
    };

    if (existing?.id) {
      await supabase.from('games').update(payload).eq('id', existing.id);
      updated++;
    } else {
      await supabase.from('games').insert(payload);
      inserted++;
    }
  }

  console.log(`  Done: ${inserted} inserted, ${updated} updated`);
}

async function main() {
  const HISTORICAL_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

  console.log('UCSB Lacrosse — Historical Game Import');
  console.log('======================================');
  console.log(`Importing ${HISTORICAL_YEARS.length} seasons: ${HISTORICAL_YEARS.join(', ')}\n`);

  for (const year of HISTORICAL_YEARS) {
    await importYear(year);
    // Small delay to be polite to mcla.us
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\nImport complete.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
