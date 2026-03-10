import { NextRequest, NextResponse } from 'next/server';
import { fetchPolls } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const week = request.nextUrl.searchParams.get('week') ?? undefined;
  try {
    const data = await fetchPolls(week);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Polls API error:', err);
    return NextResponse.json({ error: 'Failed to fetch poll data' }, { status: 500 });
  }
}
