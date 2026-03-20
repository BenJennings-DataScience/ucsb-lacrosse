import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Saves a LinkedIn URL for an alumni — triggers enrichment separately
export async function PATCH(req: Request) {
  const { id, linkedin_url } = await req.json();

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('alumni')
    .update({ linkedin_url: linkedin_url || null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
