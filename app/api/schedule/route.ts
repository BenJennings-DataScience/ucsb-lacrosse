import { NextResponse } from 'next/server';
import { fetchSchedule } from '@/lib/scraper';

export async function GET() {
  try {
    const data = await fetchSchedule();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Schedule API error:', err);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
