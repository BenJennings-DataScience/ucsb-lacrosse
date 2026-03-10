export const dynamic = 'force-dynamic';

import { fetchSchedule } from '@/lib/scraper';
import type { Game } from '@/lib/scraper';

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="badge-upcoming">TBD</span>;
  if (result === 'W') return <span className="badge-win">W</span>;
  return <span className="badge-loss">L</span>;
}

function GameCard({ game, index }: { game: Game; index: number }) {
  const isCompleted = game.result !== null;
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 rounded-xl mb-2"
      style={{
        backgroundColor: isCompleted ? 'var(--surface)' : '#0d1f36',
        border: `1px solid ${isCompleted ? 'var(--border)' : '#1e4a7a'}`,
      }}
    >
      {/* Game number */}
      <div
        className="font-black text-xl min-w-[2rem] text-center hidden sm:block"
        style={{ color: 'rgba(255,255,255,0.1)' }}
      >
        {index + 1}
      </div>

      {/* Date block */}
      <div
        className="text-center shrink-0"
        style={{
          backgroundColor: 'var(--navy)',
          borderRadius: '0.5rem',
          padding: '0.4rem 0.75rem',
          minWidth: '60px',
        }}
      >
        <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>
          {game.date}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>
          {game.month} · {game.day}
        </div>
      </div>

      {/* Opponent + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-sm" style={{ color: 'var(--muted)' }}>
            {game.isAway ? 'Away @' : 'Home vs'}
          </span>
          <span className="font-bold text-white text-base">{game.opponent}</span>
          {game.gameType === 'Divisional' && (
            <span
              className="text-xs px-2 py-0.5 rounded font-bold"
              style={{ backgroundColor: '#1e3a5f', color: '#93c5fd', fontSize: '0.65rem' }}
            >
              DIVISIONAL
            </span>
          )}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>
          {game.venue}
          {game.time && <span style={{ opacity: 0.6 }}> · {game.time}</span>}
        </div>
      </div>

      {/* Score + badge */}
      <div className="flex items-center gap-3 shrink-0">
        {game.score ? (
          <span
            className="font-mono font-black text-lg"
            style={{ color: game.result === 'W' ? '#86efac' : '#fca5a5' }}
          >
            {game.score}
          </span>
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{game.time || '—'}</span>
        )}
        <ResultBadge result={game.result} />
      </div>
    </div>
  );
}

export default async function SchedulePage() {
  let data = null;
  try {
    data = await fetchSchedule();
  } catch {
    // handled below
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Schedule</h1>
        <p style={{ color: '#fca5a5' }}>Failed to load schedule data. Check your network.</p>
      </div>
    );
  }

  const wins = data.games.filter((g) => g.result === 'W').length;
  const losses = data.games.filter((g) => g.result === 'L').length;
  const remaining = data.games.filter((g) => g.result === null).length;

  return (
    <div>
      <div className="mb-8">
        <p className="section-title">2026 Season</p>
        <h1 className="text-3xl font-black text-white mb-1">Schedule &amp; Results</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          UC Santa Barbara Gauchos Men&apos;s Lacrosse · MCLA
        </p>
      </div>

      {/* Record summary */}
      <div
        className="flex flex-wrap gap-6 mb-8 p-5 rounded-xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {[
          { label: 'Overall', value: data.record.overall },
          { label: 'Division', value: data.record.division },
          { label: 'Home', value: data.record.home },
          { label: 'Away', value: data.record.away },
          { label: 'Streak', value: data.record.streak },
          { label: 'Wins', value: String(wins) },
          { label: 'Losses', value: String(losses) },
          { label: 'Remaining', value: String(remaining) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ color: 'var(--muted)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {label}
            </div>
            <div className="font-black text-xl text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Game list */}
      <div>
        {data.games.map((game, i) => (
          <GameCard key={i} game={game} index={i} />
        ))}
      </div>

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
