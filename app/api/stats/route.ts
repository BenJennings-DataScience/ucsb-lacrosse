import { NextResponse } from 'next/server';
import { fetchStats } from '@/lib/scraper';

export async function GET() {
  try {
    const data = await fetchStats();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
