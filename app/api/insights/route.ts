/**
 * GET /api/insights
 * Returns historical win/loss record broken down by opponent and home/away.
 *
 * Response shape:
 * {
 *   opponents: Array<{
 *     name: string;
 *     home_wins: number; home_losses: number;
 *     away_wins: number; away_losses: number;
 *     total_wins: number; total_losses: number;
 *     win_pct: number;  // 0–100
 *   }>
 * }
 */
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data: games, error } = await supabase
    .from('games')
    .select('opponent, is_home, is_win')
    .not('ucsb_score', 'is', null) // completed games only
    .not('is_win', 'is', null);    // skip ties / unknown

  if (error) return Response.json({ error: error.message }, { status: 500 });

  type Record = { home_wins: number; home_losses: number; away_wins: number; away_losses: number };
  const map = new Map<string, Record>();

  for (const g of games ?? []) {
    if (!g.opponent) continue;
    if (!map.has(g.opponent)) {
      map.set(g.opponent, { home_wins: 0, home_losses: 0, away_wins: 0, away_losses: 0 });
    }
    const rec = map.get(g.opponent)!;
    if (g.is_home) {
      g.is_win ? rec.home_wins++ : rec.home_losses++;
    } else {
      g.is_win ? rec.away_wins++ : rec.away_losses++;
    }
  }

  const opponents = Array.from(map.entries())
    .map(([name, rec]) => {
      const total_wins = rec.home_wins + rec.away_wins;
      const total_losses = rec.home_losses + rec.away_losses;
      const total = total_wins + total_losses;
      return {
        name,
        home_wins: rec.home_wins,
        home_losses: rec.home_losses,
        away_wins: rec.away_wins,
        away_losses: rec.away_losses,
        total_wins,
        total_losses,
        win_pct: total > 0 ? Math.round((total_wins / total) * 100) : 0,
      };
    })
    // Sort by total games played descending (most frequent opponents first)
    .sort((a, b) => (b.total_wins + b.total_losses) - (a.total_wins + a.total_losses));

  return Response.json({ opponents });
}
