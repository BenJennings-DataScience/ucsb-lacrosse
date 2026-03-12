import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface HometownPlayer {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  hometown: string | null;
  hometown_lat: number;
  hometown_lng: number;
  photo_url: string | null;
  slug: string | null;
}

export async function GET() {
  const { data, error } = await supabase
    .from('players')
    .select('id, name, number, position, hometown, hometown_lat, hometown_lng, photo_url, slug')
    .not('hometown_lat', 'is', null)
    .not('hometown_lng', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as HometownPlayer[]);
}
