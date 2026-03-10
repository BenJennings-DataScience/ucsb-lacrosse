export const dynamic = 'force-dynamic';

import { fetchStats } from '@/lib/scraper';
import type { FieldPlayer, Goalie } from '@/lib/scraper';

function PositionBadge({ pos }: { pos: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    A: { bg: '#1e3a5f', text: '#93c5fd' },
    M: { bg: '#14532d', text: '#86efac' },
    D: { bg: '#4c1d95', text: '#c4b5fd' },
    G: { bg: '#7f1d1d', text: '#fca5a5' },
    FO: { bg: '#431407', text: '#fdba74' },
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

function LeaderCard({ label, name, stat, suffix }: { label: string; name: string; stat: string; suffix: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'linear-gradient(135deg, #003660, #001d3d)', border: '1px solid #1e4a7a' }}
    >
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

function FieldTable({ players }: { players: FieldPlayer[] }) {
  if (!players.length) return null;
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
    >
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
              <th title="Games Played">GP</th>
              <th title="Goals">G</th>
              <th title="Assists">A</th>
              <th title="Points" style={{ color: '#ffe066' }}>PTS</th>
              <th title="Shots">SH</th>
              <th title="Ground Balls">GB</th>
              <th title="Caused Turnovers">CTO</th>
              <th title="Faceoffs Won">FO-W</th>
              <th title="Faceoffs Lost">FO-L</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ paddingLeft: '1.25rem', color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'left' }}>
                  {p.jersey}
                </td>
                <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {p.position && <PositionBadge pos={p.position} />}
                  <span className="font-semibold">{p.name}</span>
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

function GoalieTable({ goalies }: { goalies: Goalie[] }) {
  if (!goalies.length) return null;
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
    >
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
              <th title="Games Played">GP</th>
              <th title="Goals Against">GA</th>
              <th title="Saves">SV</th>
              <th title="Save Percentage" style={{ color: '#ffe066' }}>SV%</th>
              <th title="Goals">G</th>
              <th title="Assists">A</th>
            </tr>
          </thead>
          <tbody>
            {goalies.map((g, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ paddingLeft: '1.25rem', color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'left' }}>
                  {g.jersey}
                </td>
                <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                  <PositionBadge pos="G" />
                  <span className="font-semibold">{g.name}</span>
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

  const byGoals = [...data.fieldPlayers].sort((a, b) => (parseInt(b.goals) || 0) - (parseInt(a.goals) || 0));
  const byAssists = [...data.fieldPlayers].sort((a, b) => (parseInt(b.assists) || 0) - (parseInt(a.assists) || 0));
  const topScorer = data.fieldPlayers[0]; // already sorted by points

  return (
    <div>
      <div className="mb-8">
        <p className="section-title">2026 Season</p>
        <h1 className="text-3xl font-black text-white mb-1">Player Statistics</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          UC Santa Barbara Gauchos Men&apos;s Lacrosse · MCLA · Sorted by points
        </p>
      </div>

      {/* Stat leaders */}
      {topScorer && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <LeaderCard label="Points Leader" name={topScorer.name} stat={topScorer.points} suffix="PTS" />
          {byGoals[0] && <LeaderCard label="Goals Leader" name={byGoals[0].name} stat={byGoals[0].goals} suffix="G" />}
          {byAssists[0] && <LeaderCard label="Assists Leader" name={byAssists[0].name} stat={byAssists[0].assists} suffix="A" />}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <FieldTable players={data.fieldPlayers} />
        <GoalieTable goalies={data.goalies} />
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
