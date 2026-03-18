export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import RecordTable from './RecordTable';
import type { OpponentRecord } from './RecordTable';

async function getOpponentRecords(): Promise<OpponentRecord[]> {
  const { data: games, error } = await supabase
    .from('games')
    .select('opponent, is_home, is_win')
    .not('ucsb_score', 'is', null)
    .not('is_win', 'is', null);

  if (error || !games) return [];

  type Rec = { home_wins: number; home_losses: number; away_wins: number; away_losses: number };
  const map = new Map<string, Rec>();

  for (const g of games) {
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

  return Array.from(map.entries()).map(([name, rec]) => {
    const total_wins = rec.home_wins + rec.away_wins;
    const total_losses = rec.home_losses + rec.away_losses;
    const total = total_wins + total_losses;
    return {
      name,
      ...rec,
      total_wins,
      total_losses,
      win_pct: total > 0 ? Math.round((total_wins / total) * 100) : 0,
    };
  });
}

export default async function InsightsPage() {
  const opponents = await getOpponentRecords();

  return (
    <div>
      <div className="mb-8">
        <p className="section-title">Analytics</p>
        <h1 className="text-3xl font-black text-white mb-1">Insights</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          UC Santa Barbara Gauchos · Historical win/loss records
        </p>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-black text-white mb-1">Record vs Opponents</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          All-time results broken down by home and away games · click any column to sort
        </p>
      </div>

      {opponents.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          No historical data yet. Run <code className="text-white">npm run import-history</code> to populate.
        </div>
      ) : (
        <RecordTable opponents={opponents} />
      )}

      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
        Includes all seasons stored in the database · Run{' '}
        <code className="text-white">npm run import-history</code> to backfill 2016–2025
      </p>
    </div>
  );
}
