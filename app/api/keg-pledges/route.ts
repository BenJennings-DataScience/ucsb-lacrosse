/**
 * Keg pledge API.
 *
 * Required Supabase migration:
 *
 *   create table public.keg_pledges (
 *     id           uuid primary key default gen_random_uuid(),
 *     game_id      uuid references public.games(id) on delete cascade,
 *     name         text not null,
 *     amount       numeric(10,2) not null check (amount > 0),
 *     venmo_handle text,
 *     anonymous    boolean not null default false,
 *     created_at   timestamptz not null default now()
 *   );
 *   alter table public.keg_pledges enable row level security;
 *   create policy "public read"  on public.keg_pledges for select using (true);
 *   create policy "public insert" on public.keg_pledges for insert with check (true);
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface KegGame {
  id: string;
  date: string;
  opponent: string;
  is_home: boolean;
  is_win: boolean | null;
  ucsb_score: number | null;
  opponent_score: number | null;
  totalPledged: number;
  pledgeCount: number;
  contributors: { name: string; amount: number }[];
}

export async function GET() {
  const [gamesRes, pledgesRes] = await Promise.all([
    supabase
      .from('games')
      .select('id, date, opponent, is_home, is_win, ucsb_score, opponent_score')
      .order('date', { ascending: false }),
    supabase
      .from('keg_pledges')
      .select('game_id, pledger_name, amount, anonymous')
      .order('created_at', { ascending: true }),
  ]);

  if (gamesRes.error) {
    return NextResponse.json({ error: gamesRes.error.message }, { status: 500 });
  }

  // Aggregate pledges per game
  const pledgeMap = new Map<
    string,
    { total: number; count: number; contributors: { name: string; amount: number }[] }
  >();
  for (const p of pledgesRes.data ?? []) {
    if (!pledgeMap.has(p.game_id)) {
      pledgeMap.set(p.game_id, { total: 0, count: 0, contributors: [] });
    }
    const entry = pledgeMap.get(p.game_id)!;
    entry.total += Number(p.amount);
    entry.count += 1;
    entry.contributors.push({
      name: p.anonymous ? 'Anonymous Gaucho' : p.pledger_name,
      amount: Number(p.amount),
    });
  }

  const result: KegGame[] = (gamesRes.data ?? []).map((g) => ({
    ...g,
    totalPledged: pledgeMap.get(g.id)?.total ?? 0,
    pledgeCount: pledgeMap.get(g.id)?.count ?? 0,
    contributors: pledgeMap.get(g.id)?.contributors ?? [],
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { game_id, name, amount, venmo_handle, anonymous } = body;

  if (!game_id || !name?.trim() || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await supabase.from('keg_pledges').insert({
    game_id,
    pledger_name: String(name).trim(),
    amount: Number(amount),
    venmo_handle: venmo_handle?.trim() || null,
    anonymous: Boolean(anonymous),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
