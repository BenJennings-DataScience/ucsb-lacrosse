/**
 * Duels API — prop board challenges.
 *
 * Required Supabase migration (run in SQL Editor):
 *
 *   create table public.duels (
 *     id            uuid default gen_random_uuid() primary key,
 *     week_label    text not null,
 *     player_name   text not null,
 *     stat_type     text not null,
 *     line          numeric not null,
 *     actual_result numeric,
 *     status        text default 'open',
 *     game_date     date,
 *     context       text,
 *     created_at    timestamptz default now()
 *   );
 *
 *   -- If table already exists, add context column:
 *   -- alter table public.duels add column if not exists context text;
 *   alter table public.duels enable row level security;
 *   create policy "public read"   on public.duels for select using (true);
 *   create policy "public insert" on public.duels for insert with check (true);
 *   create policy "public update" on public.duels for update using (true);
 *
 *   create table public.duel_matchups (
 *     id               uuid default gen_random_uuid() primary key,
 *     duel_id          uuid references public.duels(id),
 *     challenger_name  text not null,
 *     challenger_email text,
 *     challenger_side  text not null,
 *     opponent_name    text not null,
 *     opponent_email   text,
 *     pledge_amount    numeric not null,
 *     status           text default 'active',
 *     loser_paid       boolean default false,
 *     created_at       timestamptz default now()
 *   );
 *   alter table public.duel_matchups enable row level security;
 *   create policy "public read"   on public.duel_matchups for select using (true);
 *   create policy "public insert" on public.duel_matchups for insert with check (true);
 *   create policy "public update" on public.duel_matchups for update using (true);
 *
 * Seed data (reset + insert 3 props for Santa Clara):
 *
 *   delete from public.duel_matchups;
 *   delete from public.duels;
 *
 *   insert into public.duels (week_label, player_name, stat_type, line, status, game_date, context) values
 *     ('vs Santa Clara', 'Reid Habas', 'Goals', 3.5, 'open', '2026-03-21',
 *      'Habas is averaging 1.9 goals/game this season — this line asks if he goes beast mode. In his last 3 games: 3, 1, 3 goals.'),
 *     ('vs Santa Clara', 'UCSB Long Pole', 'Long Pole Goals', 0.5, 'open', '2026-03-21',
 *      'UCSB long poles rarely crack the scoresheet — but when they do, it''s electric. Will a d-pole find the back of the net?'),
 *     ('vs Santa Clara', 'UCSB Team', 'Total Points Scored', 15.5, 'open', '2026-03-21',
 *      'UCSB is averaging 12+ goals per game. Santa Clara has allowed 15+ in multiple games. Does the offense explode?');
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('duels')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
