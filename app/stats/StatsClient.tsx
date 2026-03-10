'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { FieldPlayer, Goalie } from '@/lib/scraper';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc';

type FieldSortKey =
  | 'gp' | 'goals' | 'assists' | 'points'
  | 'shots' | 'groundBalls' | 'turnovers'
  | 'faceoffWins' | 'faceoffLosses';

type GoalieSortKey =
  | 'gp' | 'goalsAgainst' | 'saves' | 'savePct' | 'goals' | 'assists';

function n(s: string) { return parseFloat(s) || 0; }

// ── Shared sub-components ─────────────────────────────────────────────────────

function PositionBadge({ pos }: { pos: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    A:   { bg: '#1e3a5f', text: '#93c5fd' },
    M:   { bg: '#14532d', text: '#86efac' },
    D:   { bg: '#4c1d95', text: '#c4b5fd' },
    G:   { bg: '#7f1d1d', text: '#fca5a5' },
    FO:  { bg: '#431407', text: '#fdba74' },
    LSM: { bg: '#1e293b', text: '#94a3b8' },
  };
  const c = colors[pos] ?? { bg: '#1e293b', text: '#94a3b8' };
  return (
    <span
      className="inline-block rounded font-bold mr-1.5"
      style={{ backgroundColor: c.bg, color: c.text, fontSize: '0.6rem', letterSpacing: '0.05em', padding: '2px 6px' }}
    >
      {pos}
    </span>
  );
}

function Td({ value, gold }: { value: string; gold?: boolean }) {
  const isZero = value === '0' || value === '';
  return (
    <td style={{ color: gold && !isZero ? '#FEBC11' : isZero ? 'var(--muted)' : 'var(--text)', fontWeight: gold && !isZero ? 700 : 400 }}>
      {value || '—'}
    </td>
  );
}

function SortTh({
  label, title, active, dir, onClick, gold, left,
}: {
  label: string;
  title?: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  gold?: boolean;
  left?: boolean;
}) {
  return (
    <th
      title={title}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        textAlign: left ? 'left' : 'center',
        paddingLeft: left ? '1.25rem' : undefined,
        color: active ? '#FEBC11' : gold ? '#ffe066' : undefined,
        transition: 'color 0.15s',
      }}
    >
      {label}
      <span style={{ marginLeft: 4, opacity: active ? 1 : 0, fontSize: '0.7em' }}>
        {dir === 'desc' ? '↓' : '↑'}
      </span>
    </th>
  );
}

// ── LeaderCard ────────────────────────────────────────────────────────────────

function LeaderCard({ label, name, stat, suffix }: { label: string; name: string; stat: string; suffix: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #003660, #001d3d)', border: '1px solid #1e4a7a' }}>
      <p style={{ color: 'var(--muted)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </p>
      <p className="font-bold text-white text-base mt-1 truncate">{name}</p>
      <p className="font-black mt-1" style={{ color: '#FEBC11', fontSize: '2.25rem', lineHeight: 1 }}>
        {stat}
        <span className="text-sm font-semibold ml-1" style={{ color: 'var(--muted)' }}>{suffix}</span>
      </p>
    </div>
  );
}

// ── Field Players Table ───────────────────────────────────────────────────────

const FIELD_COLS: { key: FieldSortKey; label: string; title: string; gold?: boolean }[] = [
  { key: 'gp',           label: 'GP',   title: 'Games Played' },
  { key: 'goals',        label: 'G',    title: 'Goals',             gold: true },
  { key: 'assists',      label: 'A',    title: 'Assists',           gold: true },
  { key: 'points',       label: 'PTS',  title: 'Points',            gold: true },
  { key: 'shots',        label: 'SH',   title: 'Shots' },
  { key: 'groundBalls',  label: 'GB',   title: 'Ground Balls' },
  { key: 'turnovers',    label: 'CTO',  title: 'Caused Turnovers' },
  { key: 'faceoffWins',  label: 'FO-W', title: 'Faceoffs Won' },
  { key: 'faceoffLosses',label: 'FO-L', title: 'Faceoffs Lost' },
];

function FieldTable({ players }: { players: FieldPlayer[] }) {
  const [sortKey, setSortKey] = useState<FieldSortKey>('points');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: FieldSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = useMemo(
    () => [...players].sort((a, b) => {
      const av = n(a[sortKey] as string);
      const bv = n(b[sortKey] as string);
      return sortDir === 'desc' ? bv - av : av - bv;
    }),
    [players, sortKey, sortDir],
  );

  if (!players.length) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="section-title" style={{ marginBottom: 0 }}>Field Players</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>#</th>
              <th style={{ textAlign: 'left' }}>Player</th>
              <th title="Eligibility">EL</th>
              {FIELD_COLS.map((col) => (
                <SortTh
                  key={col.key}
                  label={col.label}
                  title={col.title}
                  active={sortKey === col.key}
                  dir={sortDir}
                  onClick={() => handleSort(col.key)}
                  gold={col.gold}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.slug || i} style={{ backgroundColor: i % 2 !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ paddingLeft: '1.25rem', color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'left' }}>
                  {p.jersey}
                </td>
                <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {p.position && <PositionBadge pos={p.position} />}
                  {p.slug ? (
                    <Link href={`/players/${p.slug}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }} className="hover:underline">
                      {p.name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{p.name}</span>
                  )}
                </td>
                <td style={{ color: 'var(--muted)' }}>{p.eligibility || '—'}</td>
                <Td value={p.gp} />
                <Td value={p.goals} gold />
                <Td value={p.assists} gold />
                <Td value={p.points} gold />
                <Td value={p.shots} />
                <Td value={p.groundBalls} />
                <Td value={p.turnovers} />
                <Td value={p.faceoffWins} />
                <Td value={p.faceoffLosses} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Goalie Table ──────────────────────────────────────────────────────────────

const GOALIE_COLS: { key: GoalieSortKey; label: string; title: string; gold?: boolean }[] = [
  { key: 'gp',          label: 'GP',   title: 'Games Played' },
  { key: 'goalsAgainst',label: 'GA',   title: 'Goals Against' },
  { key: 'saves',       label: 'SV',   title: 'Saves' },
  { key: 'savePct',     label: 'SV%',  title: 'Save Percentage', gold: true },
  { key: 'goals',       label: 'G',    title: 'Goals' },
  { key: 'assists',     label: 'A',    title: 'Assists' },
];

function GoalieTable({ goalies }: { goalies: Goalie[] }) {
  const [sortKey, setSortKey] = useState<GoalieSortKey>('savePct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: GoalieSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = useMemo(
    () => [...goalies].sort((a, b) => {
      const av = n(a[sortKey] as string);
      const bv = n(b[sortKey] as string);
      return sortDir === 'desc' ? bv - av : av - bv;
    }),
    [goalies, sortKey, sortDir],
  );

  if (!goalies.length) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="section-title" style={{ marginBottom: 0 }}>Goalies</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>#</th>
              <th style={{ textAlign: 'left' }}>Player</th>
              <th title="Eligibility">EL</th>
              {GOALIE_COLS.map((col) => (
                <SortTh
                  key={col.key}
                  label={col.label}
                  title={col.title}
                  active={sortKey === col.key}
                  dir={sortDir}
                  onClick={() => handleSort(col.key)}
                  gold={col.gold}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((g, i) => (
              <tr key={g.slug || i} style={{ backgroundColor: i % 2 !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ paddingLeft: '1.25rem', color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'left' }}>
                  {g.jersey}
                </td>
                <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                  <PositionBadge pos="G" />
                  {g.slug ? (
                    <Link href={`/players/${g.slug}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }} className="hover:underline">
                      {g.name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{g.name}</span>
                  )}
                </td>
                <td style={{ color: 'var(--muted)' }}>{g.eligibility || '—'}</td>
                <Td value={g.gp} />
                <Td value={g.goalsAgainst} />
                <Td value={g.saves} />
                <td style={{ color: '#FEBC11', fontWeight: 700 }}>{g.savePct}</td>
                <Td value={g.goals} />
                <Td value={g.assists} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function StatsClient({
  fieldPlayers,
  goalies,
}: {
  fieldPlayers: FieldPlayer[];
  goalies: Goalie[];
}) {
  const topScorer = [...fieldPlayers].sort((a, b) => (parseFloat(b.points) || 0) - (parseFloat(a.points) || 0))[0];
  const topGoals  = [...fieldPlayers].sort((a, b) => (parseFloat(b.goals)  || 0) - (parseFloat(a.goals)  || 0))[0];
  const topAssists= [...fieldPlayers].sort((a, b) => (parseFloat(b.assists)||0) - (parseFloat(a.assists)||0))[0];

  return (
    <>
      {topScorer && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <LeaderCard label="Points Leader"  name={topScorer.name}  stat={topScorer.points}  suffix="PTS" />
          {topGoals   && <LeaderCard label="Goals Leader"   name={topGoals.name}   stat={topGoals.goals}   suffix="G" />}
          {topAssists && <LeaderCard label="Assists Leader" name={topAssists.name} stat={topAssists.assists} suffix="A" />}
        </div>
      )}
      <div className="flex flex-col gap-6">
        <FieldTable  players={fieldPlayers} />
        <GoalieTable goalies={goalies} />
      </div>
    </>
  );
}
