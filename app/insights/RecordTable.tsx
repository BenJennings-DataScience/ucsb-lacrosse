'use client';
import { useState } from 'react';

export interface OpponentRecord {
  name: string;
  home_wins: number;
  home_losses: number;
  away_wins: number;
  away_losses: number;
  total_wins: number;
  total_losses: number;
  win_pct: number;
}

type SortKey = 'name' | 'home' | 'away' | 'total' | 'win_pct';
type SortDir = 'asc' | 'desc';

function WLCell({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) return <span style={{ color: 'var(--muted)' }}>—</span>;
  return (
    <span className="font-mono font-bold text-sm">
      <span style={{ color: '#86efac' }}>{wins}</span>
      <span style={{ color: 'var(--muted)' }}>–</span>
      <span style={{ color: '#fca5a5' }}>{losses}</span>
    </span>
  );
}

function WinPctBar({ pct }: { pct: number }) {
  const color = pct >= 60 ? '#86efac' : pct >= 40 ? '#FEBC11' : '#fca5a5';
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 60, height: 6, backgroundColor: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </div>
      <span className="text-sm font-bold" style={{ color, minWidth: '2.5rem' }}>
        {pct}%
      </span>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      width="8" height="12" viewBox="0 0 8 12" fill="none"
      style={{ display: 'inline', marginLeft: 4, opacity: active ? 1 : 0.3, flexShrink: 0 }}
    >
      <path d="M4 1L1 4.5H7L4 1Z" fill={active && dir === 'asc' ? 'var(--gold)' : 'currentColor'} />
      <path d="M4 11L7 7.5H1L4 11Z" fill={active && dir === 'desc' ? 'var(--gold)' : 'currentColor'} />
    </svg>
  );
}

function sortOpponents(data: OpponentRecord[], key: SortKey, dir: SortDir): OpponentRecord[] {
  return [...data].sort((a, b) => {
    let av = 0, bv = 0;
    if (key === 'name') {
      const cmp = a.name.localeCompare(b.name);
      return dir === 'asc' ? cmp : -cmp;
    }
    if (key === 'home')    { av = a.home_wins + a.home_losses;  bv = b.home_wins + b.home_losses; }
    if (key === 'away')    { av = a.away_wins + a.away_losses;  bv = b.away_wins + b.away_losses; }
    if (key === 'total')   { av = a.total_wins + a.total_losses; bv = b.total_wins + b.total_losses; }
    if (key === 'win_pct') { av = a.win_pct; bv = b.win_pct; }
    return dir === 'asc' ? av - bv : bv - av;
  });
}

export default function RecordTable({ opponents }: { opponents: OpponentRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  const sorted = sortOpponents(opponents, sortKey, sortDir);

  function ColHeader({ label, colKey, align = 'center' }: { label: string; colKey: SortKey; align?: 'left' | 'center' }) {
    const active = sortKey === colKey;
    return (
      <button
        onClick={() => handleSort(colKey)}
        className={`flex items-center gap-0.5 text-xs font-black uppercase tracking-widest transition-colors ${align === 'center' ? 'justify-center w-full' : ''}`}
        style={{ color: active ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
      >
        {label}
        <SortIcon active={active} dir={sortDir} />
      </button>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div
        className="grid items-center px-4 py-3"
        style={{ backgroundColor: '#0a1f3a', gridTemplateColumns: '1fr 90px 90px 90px 110px' }}
      >
        <ColHeader label="Opponent" colKey="name" align="left" />
        <ColHeader label="Home" colKey="home" />
        <ColHeader label="Away" colKey="away" />
        <ColHeader label="Total" colKey="total" />
        <ColHeader label="Win %" colKey="win_pct" />
      </div>

      {/* Rows */}
      {sorted.map((opp, i) => (
        <div
          key={opp.name}
          className="grid items-center px-4 py-3"
          style={{
            gridTemplateColumns: '1fr 90px 90px 90px 110px',
            backgroundColor: i % 2 === 0 ? 'var(--surface)' : '#0c1e33',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div className="font-semibold text-white text-sm truncate pr-4">{opp.name}</div>
          <div className="text-center"><WLCell wins={opp.home_wins} losses={opp.home_losses} /></div>
          <div className="text-center"><WLCell wins={opp.away_wins} losses={opp.away_losses} /></div>
          <div className="text-center"><WLCell wins={opp.total_wins} losses={opp.total_losses} /></div>
          <div><WinPctBar pct={opp.win_pct} /></div>
        </div>
      ))}
    </div>
  );
}
