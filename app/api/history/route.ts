/**
 * GET /api/history?year=2019
 * Returns all stored games for a given past season from Supabase.
 */
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get('year') ?? '');
  if (!year || year < 2010 || year > 2099) {
    return Response.json({ error: 'Valid year required' }, { status: 400 });
  }

  // Resolve season row
  const { data: season, error: sErr } = await supabase
    .from('seasons')
    .select('id, wins, losses')
    .eq('year', year)
    .maybeSingle();

  if (sErr) return Response.json({ error: sErr.message }, { status: 500 });
  if (!season) return Response.json({ games: [], record: null, year });

  const { data: games, error: gErr } = await supabase
    .from('games')
    .select('date, opponent, is_home, venue, ucsb_score, opponent_score, is_win')
    .eq('season_id', season.id)
    .not('ucsb_score', 'is', null) // completed games only
    .order('date', { ascending: true });

  if (gErr) return Response.json({ error: gErr.message }, { status: 500 });

  return Response.json({
    year,
    record: { wins: season.wins, losses: season.losses },
    games: games ?? [],
  });
}
