export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { fetchStats } from '@/lib/scraper';
import type { FieldPlayer, Goalie } from '@/lib/scraper';

const POS_NAMES: Record<string, string> = {
  A: 'Attack',
  M: 'Midfield',
  D: 'Defense',
  G: 'Goalies',
  FO: 'Faceoff',
  FOS: 'Faceoff Specialist',
  LSM: 'Long-Stick Mid',
  SSDM: 'Short-Stick Def Mid',
};

const RANK_COLORS = [
  { bg: '#FEBC11', text: '#003660' },   // gold
  { bg: '#94a3b8', text: '#0b1120' },   // silver
  { bg: '#b45309', text: '#fff' },      // bronze
];

function RankBadge({ rank }: { rank: number }) {
  const c = RANK_COLORS[rank] ?? { bg: '#1e3a5f', text: '#93c5fd' };
  return (
    <span
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderRadius: '50%',
        width: '1.5rem',
        height: '1.5rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '0.7rem',
        flexShrink: 0,
      }}
    >
      {rank + 1}
    </span>
  );
}

function MiniLeaderTable({
  label,
  players,
  statKey,
  statLabel,
}: {
  label: string;
  players: FieldPlayer[];
  statKey: 'goals' | 'assists' | 'points';
  statLabel: string;
}) {
  const sorted = [...players]
    .sort((a, b) => (parseInt(b[statKey]) || 0) - (parseInt(a[statKey]) || 0))
    .slice(0, 3);

  return (
    <div
      style={{
        backgroundColor: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: '0.625rem',
        overflow: 'hidden',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--navy)',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <p
          style={{
            fontSize: '0.6rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--gold)',
            margin: 0,
          }}
        >
          {label} · {statLabel}
        </p>
      </div>
      <div style={{ padding: '0.5rem 0' }}>
        {sorted.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>—</p>
        ) : (
          sorted.map((p, i) => (
            <div
              key={p.slug || p.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <RankBadge rank={i} />
              <Link
                href={`/players/${p.slug}`}
                style={{
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.name}
              </Link>
              <span
                style={{
                  color: 'var(--gold)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {p[statKey] || '0'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GoalieMiniTable({
  label,
  goalies,
  statKey,
  statLabel,
}: {
  label: string;
  goalies: Goalie[];
  statKey: 'saves' | 'goalsAgainst' | 'savePct';
  statLabel: string;
}) {
  const sorted = [...goalies]
    .sort((a, b) => {
      if (statKey === 'savePct') {
        return (parseFloat(b[statKey]) || 0) - (parseFloat(a[statKey]) || 0);
      }
      if (statKey === 'goalsAgainst') {
        return (parseInt(a[statKey]) || 0) - (parseInt(b[statKey]) || 0);
      }
      return (parseInt(b[statKey]) || 0) - (parseInt(a[statKey]) || 0);
    })
    .slice(0, 3);

  return (
    <div
      style={{
        backgroundColor: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: '0.625rem',
        overflow: 'hidden',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--navy)',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <p
          style={{
            fontSize: '0.6rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--gold)',
            margin: 0,
          }}
        >
          {label} · {statLabel}
        </p>
      </div>
      <div style={{ padding: '0.5rem 0' }}>
        {sorted.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>—</p>
        ) : (
          sorted.map((g, i) => (
            <div
              key={g.slug || g.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <RankBadge rank={i} />
              <Link
                href={`/players/${g.slug}`}
                style={{
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {g.name}
              </Link>
              <span
                style={{
                  color: 'var(--gold)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {g[statKey] || '0'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default async function LeadersPage() {
  let data = null;
  try {
    data = await fetchStats();
  } catch {
    // handled below
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Leaders</h1>
        <p style={{ color: '#fca5a5' }}>Failed to load stats data. Check your network.</p>
      </div>
    );
  }

  // Group field players by position
  const positionGroups: Record<string, FieldPlayer[]> = {};
  for (const p of data.fieldPlayers) {
    const pos = p.position || 'Unknown';
    if (!positionGroups[pos]) positionGroups[pos] = [];
    positionGroups[pos].push(p);
  }

  // Preferred order
  const posOrder = ['A', 'M', 'D', 'FO', 'FOS', 'LSM', 'SSDM'];
  const sortedPositions = [
    ...posOrder.filter(pos => positionGroups[pos]),
    ...Object.keys(positionGroups).filter(pos => !posOrder.includes(pos)),
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="section-title">2026 Season</p>
        <h1 className="text-3xl font-black text-white mb-1">Stat Leaders</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          UC Santa Barbara Gauchos Men&apos;s Lacrosse · MCLA · Top 3 by category
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {sortedPositions.map((pos) => {
          const players = positionGroups[pos];
          const posName = POS_NAMES[pos] ?? pos;
          return (
            <div key={pos}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: 'var(--navy)',
                    color: 'var(--gold)',
                    borderRadius: '0.375rem',
                    padding: '3px 10px',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {pos}
                </span>
                <h2
                  style={{
                    color: 'var(--text)',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    margin: 0,
                  }}
                >
                  {posName}
                </h2>
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                  ({players.length} player{players.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <MiniLeaderTable label={posName} players={players} statKey="goals" statLabel="Goals" />
                <MiniLeaderTable label={posName} players={players} statKey="assists" statLabel="Assists" />
                <MiniLeaderTable label={posName} players={players} statKey="points" statLabel="Points" />
              </div>
            </div>
          );
        })}

        {/* Goalies section */}
        {data.goalies.length > 0 && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  backgroundColor: '#7f1d1d',
                  color: '#fca5a5',
                  borderRadius: '0.375rem',
                  padding: '3px 10px',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                G
              </span>
              <h2
                style={{
                  color: 'var(--text)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  margin: 0,
                }}
              >
                Goalies
              </h2>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                ({data.goalies.length} player{data.goalies.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <GoalieMiniTable label="Goalies" goalies={data.goalies} statKey="saves" statLabel="Saves" />
              <GoalieMiniTable label="Goalies" goalies={data.goalies} statKey="savePct" statLabel="SV%" />
              <GoalieMiniTable label="Goalies" goalies={data.goalies} statKey="goalsAgainst" statLabel="GA (fewest)" />
            </div>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '2.5rem' }}>
        Data sourced from{' '}
        <a href="https://mcla.us" style={{ color: 'var(--gold)' }} target="_blank" rel="noopener noreferrer">
          mcla.us
        </a>
        {' '}· Cached for 1 hour
      </p>
    </div>
  );
}
