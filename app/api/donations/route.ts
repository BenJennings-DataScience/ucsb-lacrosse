/**
 * Program donations API.
 *
 * Required Supabase migration:
 *
 *   create table public.program_donations (
 *     id             uuid primary key default gen_random_uuid(),
 *     full_name      text not null,
 *     email          text not null,
 *     amount         numeric(10,2) not null check (amount > 0),
 *     message        text,
 *     anonymous      boolean not null default false,
 *     payment_method text not null check (payment_method in ('venmo','zelle','check')),
 *     created_at     timestamptz not null default now()
 *   );
 *   alter table public.program_donations enable row level security;
 *   create policy "public insert" on public.program_donations for insert with check (true);
 *   -- No public read policy — donor info stays private
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const { full_name, email, amount, message, anonymous, payment_method } = body;

  if (
    !full_name?.trim() ||
    !email?.trim() ||
    !amount ||
    Number(amount) <= 0 ||
    !payment_method
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await supabase.from('program_donations').insert({
    full_name: String(full_name).trim(),
    email: String(email).trim().toLowerCase(),
    amount: Number(amount),
    message: message?.trim() || null,
    anonymous: Boolean(anonymous),
    payment_method,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
