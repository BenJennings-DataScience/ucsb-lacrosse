import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Fields safe to send to the browser — email and phone are NEVER included
const SAFE_FIELDS = 'id,first_name,last_name,company,job_title,industry,grad_decade,bio,linkedin_url,open_to_networking,is_parent,tags,created_at';

export async function GET() {
  const { data, error } = await supabase
    .from('alumni')
    .select(SAFE_FIELDS)
    .order('last_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
