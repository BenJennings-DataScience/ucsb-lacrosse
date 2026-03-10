import { NextResponse } from 'next/server';
import { fetchPlayerProfile, fetchStats, fetchRoster } from '@/lib/scraper';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [profile, statsData, roster] = await Promise.all([
    fetchPlayerProfile(slug),
    fetchStats(),
    fetchRoster(),
  ]);
  // Merge stats data into profile
  const allPlayers = [...statsData.fieldPlayers, ...statsData.goalies];
  const statsPlayer = allPlayers.find(p => p.slug === slug);
  const rosterPlayer = roster.find(r => r.slug === slug);
  return NextResponse.json({ profile, stats: statsPlayer || null, roster: rosterPlayer || null });
}
