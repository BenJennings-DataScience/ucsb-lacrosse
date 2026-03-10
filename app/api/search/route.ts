import { NextRequest, NextResponse } from 'next/server';
import { fetchStats, fetchSchedule } from '@/lib/scraper';

const POSITION_KEYWORDS: Record<string, string[]> = {
  'A': ['attack', 'attacker', 'att'],
  'M': ['midfield', 'midfielder', 'mid'],
  'D': ['defense', 'defender', 'def'],
  'G': ['goalie', 'goalkeeper', 'goal keeper', 'goaltender'],
  'FO': ['faceoff', 'face off', 'fo'],
  'LSM': ['lsm', 'long stick', 'longstick'],
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().trim() || '';
  if (q.length < 2) return NextResponse.json({ players: [], games: [], positionMatch: null });

  const [statsData, scheduleData] = await Promise.all([fetchStats(), fetchSchedule()]);

  // Check if query matches a position keyword
  let positionCode: string | null = null;
  for (const [code, keywords] of Object.entries(POSITION_KEYWORDS)) {
    if (keywords.some(kw => kw.includes(q) || q.includes(kw))) {
      positionCode = code;
      break;
    }
  }

  // Player search
  const allPlayers = [...statsData.fieldPlayers, ...statsData.goalies];
  const playerResults = allPlayers
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, 8)
    .map(p => ({
      name: p.name,
      slug: p.slug,
      position: ('position' in p ? p.position : 'G'),
      goals: ('goals' in p ? p.goals : '0'),
      assists: ('assists' in p ? p.assists : '0'),
      points: ('points' in p ? p.points : '0'),
    }));

  // Position match
  let positionPlayers = null;
  if (positionCode) {
    positionPlayers = statsData.fieldPlayers.filter(p => p.position === positionCode)
      .map(p => ({ name: p.name, slug: p.slug, position: p.position, goals: p.goals, assists: p.assists, points: p.points }));
  }

  // Game search
  const gameResults = scheduleData.games
    .filter(g => g.opponent.toLowerCase().includes(q) || `${g.month} ${g.date}`.toLowerCase().includes(q) || g.date.includes(q))
    .slice(0, 5)
    .map(g => ({ opponent: g.opponent, month: g.month, date: g.date, day: g.day, result: g.result, score: g.score, isAway: g.isAway }));

  return NextResponse.json({ players: playerResults, games: gameResults, positionMatch: positionPlayers ? { code: positionCode, players: positionPlayers } : null });
}
