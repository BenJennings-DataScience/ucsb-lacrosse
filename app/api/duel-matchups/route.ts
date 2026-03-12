import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('duel_matchups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    duel_id,
    challenger_name,
    challenger_email,
    challenger_side,
    opponent_name,
    opponent_email,
    pledge_amount,
  } = body;

  if (
    !duel_id ||
    !challenger_name?.trim() ||
    !challenger_side ||
    !opponent_name?.trim() ||
    !pledge_amount ||
    Number(pledge_amount) < 10
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const { error } = await supabase.from('duel_matchups').insert({
    duel_id,
    challenger_name: String(challenger_name).trim(),
    challenger_email: challenger_email?.trim() || null,
    challenger_side,
    opponent_name: String(opponent_name).trim(),
    opponent_email: opponent_email?.trim() || null,
    pledge_amount: Number(pledge_amount),
    status: 'active',
    loser_paid: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: 'Missing matchup id' }, { status: 400 });

  const { error } = await supabase
    .from('duel_matchups')
    .update({ loser_paid: true })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
