export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { fetchSchedule } from '@/lib/scraper';
import type { Game } from '@/lib/scraper';

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="badge-upcoming">Upcoming</span>;
  if (result === 'W') return <span className="badge-win">W</span>;
  return <span className="badge-loss">L</span>;
}

function GameRow({ game }: { game: Game }) {
  return (
    <div
      className="flex items-center gap-4 py-3 px-4"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="text-center min-w-[48px]">
        <div style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
          {game.day}
        </div>
        <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.1 }}>
          {game.date}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>{game.month}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
            {game.isAway ? '@' : 'vs'}
          </span>
          <span className="font-semibold truncate">{game.opponent}</span>
          {game.gameType === 'Divisional' && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-bold"
              style={{ backgroundColor: '#1e3a5f', color: '#93c5fd', fontSize: '0.6rem' }}
            >
              DIV
            </span>
          )}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{game.venue}</div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {game.score && (
          <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>
            {game.score}
          </span>
        )}
        <ResultBadge result={game.result} />
      </div>
    </div>
  );
}

export default async function HomePage() {
  let data = null;
  try {
    data = await fetchSchedule();
  } catch {
    // show error state
  }

  const completedGames = data?.games.filter((g) => g.result !== null) ?? [];
  const upcomingGames = data?.games.filter((g) => g.result === null) ?? [];
  const recentGames = completedGames.slice(-3).reverse();
  const nextGame = upcomingGames[0] ?? null;

  const [wins, losses] = (data?.record.overall ?? '— - —').split('-').map((s) => s.trim());

  return (
    <div>
      {/* Hero */}
      <div
        className="rounded-2xl p-8 mb-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #003660 0%, #001d3d 60%, #0b1120 100%)',
          border: '1px solid #1e3a5f',
        }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 75% 50%, #FEBC11 0%, transparent 55%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-5 mb-4">
            <Image
              src="/gaucho-logo.png"
              alt="Gaucho Lax"
              width={120}
              height={120}
              className="rounded-full"
              style={{ objectFit: 'cover', border: '3px solid #FEBC11' }}
            />
            <div>
              <p className="section-title" style={{ marginBottom: '0.25rem' }}>2026 Season</p>
              <h1 className="text-4xl font-black text-white mb-1">
                UCSB <span style={{ color: '#FEBC11' }}>Gauchos</span>
              </h1>
            </div>
          </div>
          <p style={{ color: 'var(--muted)' }} className="text-sm mb-6" >
            Men&apos;s Lacrosse &mdash; MCLA
          </p>

          <div className="flex flex-wrap gap-8">
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Overall
              </div>
              <div className="font-black text-white" style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>
                {wins}
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> – </span>
                {losses}
              </div>
            </div>
            {data?.record.division && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Division
                </div>
                <div className="font-black" style={{ color: '#FEBC11', fontSize: '2.5rem', lineHeight: 1.1 }}>
                  {data.record.division}
                </div>
              </div>
            )}
            {data?.record.streak && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Streak
                </div>
                <div className="font-black text-white" style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>
                  {data.record.streak}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!data && (
        <div
          className="mb-6 p-4 rounded-lg text-sm text-center"
          style={{ backgroundColor: '#7f1d1d', color: '#fca5a5' }}
        >
          Could not load data from mcla.us. Check your network connection.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Next Game */}
        <div className="card">
          <p className="section-title">Next Game</p>
          {nextGame ? (
            <GameRow game={nextGame} />
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '0.75rem 0' }}>
              No upcoming games scheduled.
            </p>
          )}
          <div className="mt-4">
            <Link href="/schedule" className="text-sm font-semibold" style={{ color: '#FEBC11' }}>
              Full schedule →
            </Link>
          </div>
        </div>

        {/* Recent Results */}
        <div className="card">
          <p className="section-title">Recent Results</p>
          {recentGames.length > 0 ? (
            recentGames.map((game, i) => <GameRow key={i} game={game} />)
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '0.75rem 0' }}>
              No results yet.
            </p>
          )}
          <div className="mt-4">
            <Link href="/schedule" className="text-sm font-semibold" style={{ color: '#FEBC11' }}>
              All results →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { href: '/schedule', title: 'Full Schedule', desc: 'All games with scores & results' },
          { href: '/stats', title: 'Player Stats', desc: 'Goals, assists, points & more' },
        ].map(({ href, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center justify-between"
            style={{ textDecoration: 'none' }}
          >
            <div>
              <p className="font-bold text-white">{title}</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{desc}</p>
            </div>
            <span style={{ color: '#FEBC11', fontSize: '1.25rem', fontWeight: 700 }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
