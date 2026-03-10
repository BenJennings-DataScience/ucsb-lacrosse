export const dynamic = 'force-dynamic';

import { fetchPlayerProfile, fetchStats, fetchRoster } from '@/lib/scraper';
import type { GameLogEntry } from '@/lib/scraper';

const POS_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: '#1e3a5f', text: '#93c5fd' },
  M: { bg: '#14532d', text: '#86efac' },
  D: { bg: '#4c1d95', text: '#c4b5fd' },
  G: { bg: '#7f1d1d', text: '#fca5a5' },
  FO: { bg: '#431407', text: '#fdba74' },
  LSM: { bg: '#1e293b', text: '#94a3b8' },
};

function PositionBadge({ pos }: { pos: string }) {
  const c = POS_COLORS[pos] ?? { bg: '#1e293b', text: '#94a3b8' };
  return (
    <span
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderRadius: '0.25rem',
        padding: '3px 10px',
        fontWeight: 800,
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        display: 'inline-block',
      }}
    >
      {pos}
    </span>
  );
}

function StatBox({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: '0.625rem',
        padding: '0.875rem 1.25rem',
        textAlign: 'center',
        minWidth: '80px',
      }}
    >
      <div
        style={{
          color: gold ? 'var(--gold)' : 'var(--text)',
          fontWeight: 800,
          fontSize: '1.75rem',
          lineHeight: 1,
        }}
      >
        {value || '0'}
      </div>
      <div
        style={{
          color: 'var(--muted)',
          fontSize: '0.6rem',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          marginTop: '0.25rem',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function parseWL(result: string): 'W' | 'L' | null {
  const m = result.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return null;
  const ours = parseInt(m[1]);
  const theirs = parseInt(m[2]);
  if (ours > theirs) return 'W';
  if (ours < theirs) return 'L';
  return null;
}

function GameLogRow({ entry, isEven }: { entry: GameLogEntry; isEven: boolean }) {
  const wl = parseWL(entry.result);
  const isWin = wl === 'W';
  const isLoss = wl === 'L';
  const points = (parseInt(entry.goals) || 0) + (parseInt(entry.assists) || 0);

  return (
    <tr style={{ backgroundColor: isEven ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
      <td style={{ textAlign: 'left', color: 'var(--muted)', whiteSpace: 'nowrap' as const }}>
        {entry.date}
      </td>
      <td style={{ textAlign: 'left', whiteSpace: 'nowrap' as const }}>
        {entry.opponent}
      </td>
      <td style={{ whiteSpace: 'nowrap' as const }}>
        {isWin ? (
          <span className="badge-win">W</span>
        ) : isLoss ? (
          <span className="badge-loss">L</span>
        ) : null}
        {entry.result ? (
          <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: wl ? '0.4rem' : 0 }}>
            {entry.result}
          </span>
        ) : <span style={{ color: 'var(--muted)' }}>—</span>}
      </td>
      <td style={{ color: entry.goals !== '0' && entry.goals ? 'var(--gold)' : 'var(--muted)', fontWeight: entry.goals !== '0' ? 700 : 400 }}>
        {entry.goals || '—'}
      </td>
      <td style={{ color: entry.assists !== '0' && entry.assists ? 'var(--gold)' : 'var(--muted)', fontWeight: entry.assists !== '0' ? 700 : 400 }}>
        {entry.assists || '—'}
      </td>
      <td style={{ color: points > 0 ? 'var(--gold)' : 'var(--muted)', fontWeight: points > 0 ? 700 : 400 }}>
        {points || '—'}
      </td>
      <td style={{ color: 'var(--text)' }}>{entry.shots || '—'}</td>
      <td style={{ color: 'var(--text)' }}>{entry.groundBalls || '—'}</td>
    </tr>
  );
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let profile = null;
  let statsPlayer = null;
  let rosterPlayer = null;

  try {
    const [profileData, statsData, roster] = await Promise.all([
      fetchPlayerProfile(slug),
      fetchStats(),
      fetchRoster(),
    ]);
    profile = profileData;
    const allPlayers = [...statsData.fieldPlayers, ...statsData.goalies];
    statsPlayer = allPlayers.find(p => p.slug === slug) || null;
    rosterPlayer = roster.find(r => r.slug === slug) || null;
  } catch {
    // handled below
  }

  if (!profile) {
    return (
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Player Not Found</h1>
        <p style={{ color: '#fca5a5' }}>Could not load player data.</p>
      </div>
    );
  }

  const isGoalie = profile.position === 'G' ||
    (statsPlayer && 'goalsAgainst' in statsPlayer);

  // Merge data: prefer rosterPlayer for bio fields, statsPlayer for stats
  const displayName = profile.name || rosterPlayer?.name || '';
  const displayJersey = profile.jersey || rosterPlayer?.jersey || statsPlayer?.jersey || '';
  const displayPosition = profile.position || rosterPlayer?.position || (statsPlayer && 'position' in statsPlayer ? statsPlayer.position : 'G');
  const displayClass = profile.classYear || rosterPlayer?.classYear || '';
  const displayElig = profile.eligibility || rosterPlayer?.eligibility || statsPlayer?.eligibility || '';
  const displayHeight = profile.height || rosterPlayer?.height || '';
  const displayWeight = profile.weight || rosterPlayer?.weight || '';
  const displayHometown = profile.hometown || rosterPlayer?.hometown || '';
  const photoUrl = profile.photoUrl || rosterPlayer?.photoUrl || null;

  // Sorted game log: most recent first (reverse as scraped order is usually chronological)
  const gameLog = [...profile.gameLog].reverse();

  const gp = statsPlayer?.gp || '0';
  const goals = statsPlayer && 'goals' in statsPlayer ? statsPlayer.goals : '0';
  const assists = statsPlayer && 'assists' in statsPlayer ? statsPlayer.assists : '0';
  const points = statsPlayer && 'points' in statsPlayer ? statsPlayer.points : '0';

  return (
    <div>
      {/* Hero card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #003660 0%, #001d3d 60%, #0b1120 100%)',
          border: '1px solid #1e3a5f',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap' as const,
          position: 'relative' as const,
          overflow: 'hidden',
        }}
      >
        {/* Subtle gold glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(254,188,17,0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Photo or placeholder */}
        <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={displayName}
              style={{
                width: '120px',
                height: '140px',
                objectFit: 'cover',
                borderRadius: '0.75rem',
                border: '2px solid #1e4a7a',
              }}
            />
          ) : (
            <div
              style={{
                width: '120px',
                height: '140px',
                backgroundColor: 'var(--navy)',
                border: '2px solid #1e4a7a',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column' as const,
              }}
            >
              <span
                style={{
                  color: 'var(--gold)',
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  lineHeight: 1,
                }}
              >
                #{displayJersey}
              </span>
            </div>
          )}
        </div>

        {/* Player info */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' as const }}>
            {displayPosition && <PositionBadge pos={displayPosition} />}
            {displayJersey && (
              <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1rem' }}>
                #{displayJersey}
              </span>
            )}
          </div>

          <h1
            style={{
              color: 'white',
              fontWeight: 900,
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              lineHeight: 1.1,
              marginBottom: '0.75rem',
            }}
          >
            {displayName}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '1rem' }}>
            {displayClass && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                  Class
                </div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{displayClass}</div>
              </div>
            )}
            {displayElig && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                  Eligibility
                </div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{displayElig}</div>
              </div>
            )}
            {displayHeight && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                  Height
                </div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{displayHeight}</div>
              </div>
            )}
            {displayWeight && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                  Weight
                </div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{displayWeight}</div>
              </div>
            )}
            {displayHometown && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                  Hometown
                </div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{displayHometown}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Season stats bar */}
      {statsPlayer && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <p className="section-title" style={{ marginBottom: '0.75rem' }}>2026 Season Stats</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const }}>
            <StatBox label="GP" value={gp} />
            {isGoalie && 'goalsAgainst' in statsPlayer ? (
              <>
                <StatBox label="GA" value={statsPlayer.goalsAgainst} />
                <StatBox label="Saves" value={statsPlayer.saves} gold />
                <StatBox label="SV%" value={statsPlayer.savePct} gold />
                <StatBox label="Goals" value={statsPlayer.goals} />
                <StatBox label="Assists" value={statsPlayer.assists} />
              </>
            ) : (
              <>
                <StatBox label="Goals" value={goals} gold />
                <StatBox label="Assists" value={assists} gold />
                <StatBox label="Points" value={points} gold />
                {'shots' in statsPlayer && <StatBox label="Shots" value={statsPlayer.shots} />}
                {'groundBalls' in statsPlayer && <StatBox label="GB" value={statsPlayer.groundBalls} />}
              </>
            )}
          </div>
        </div>
      )}

      {/* Game log table */}
      {gameLog.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <p className="section-title" style={{ marginBottom: 0 }}>Game Log</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>Date</th>
                  <th style={{ textAlign: 'left' }}>Opponent</th>
                  <th>Result</th>
                  <th title="Goals">G</th>
                  <th title="Assists">A</th>
                  <th title="Points">PTS</th>
                  <th title="Shots">SH</th>
                  <th title="Ground Balls">GB</th>
                </tr>
              </thead>
              <tbody>
                {gameLog.map((entry, i) => (
                  <GameLogRow key={i} entry={entry} isEven={i % 2 !== 0} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {gameLog.length === 0 && (
        <div
          className="card"
          style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}
        >
          No game log data available.
        </div>
      )}

      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem' }}>
        Data sourced from{' '}
        <a href="https://mcla.us" style={{ color: 'var(--gold)' }} target="_blank" rel="noopener noreferrer">
          mcla.us
        </a>
        {' '}· Cached for 1 hour
      </p>
    </div>
  );
}
