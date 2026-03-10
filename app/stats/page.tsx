export const dynamic = 'force-dynamic';

import { fetchStats } from '@/lib/scraper';
import StatsClient from './StatsClient';

export default async function StatsPage() {
  let data = null;
  try {
    data = await fetchStats();
  } catch {
    // handled below
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Stats</h1>
        <p style={{ color: '#fca5a5' }}>Failed to load stats data. Check your network.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="section-title">2026 Season</p>
        <h1 className="text-3xl font-black text-white mb-1">Player Statistics</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          UC Santa Barbara Gauchos Men&apos;s Lacrosse · MCLA · Click any column header to sort
        </p>
      </div>

      <StatsClient fieldPlayers={data.fieldPlayers} goalies={data.goalies} />

      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '2rem' }}>
        Data sourced from{' '}
        <a href="https://mcla.us" style={{ color: 'var(--gold)' }} target="_blank" rel="noopener noreferrer">
          mcla.us
        </a>
        {' '}· Cached for 1 hour
      </p>
    </div>
  );
}
