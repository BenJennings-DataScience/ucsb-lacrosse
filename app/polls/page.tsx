export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { fetchPolls } from '@/lib/scraper';
import type { PollEntry, PollWeek } from '@/lib/scraper';

// ── Change badge ──────────────────────────────────────────────────────────────

function ChangeBadge({ entry }: { entry: PollEntry }) {
  if (entry.changeDirection === 'up') {
    return (
      <span style={{ color: '#86efac', fontWeight: 700, whiteSpace: 'nowrap' }}>
        ↑ {entry.change}
      </span>
    );
  }
  if (entry.changeDirection === 'down') {
    return (
      <span style={{ color: '#fca5a5', fontWeight: 700, whiteSpace: 'nowrap' }}>
        ↓ {entry.change}
      </span>
    );
  }
  return <span style={{ color: 'var(--muted)' }}>—</span>;
}

// ── Week selector ─────────────────────────────────────────────────────────────

function WeekSelector({ weeks, activeKey }: { weeks: PollWeek[]; activeKey: string }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {weeks.map((w) => {
        const active = w.key === activeKey;
        return (
          <Link
            key={w.key}
            href={`/polls?week=${w.key}`}
            className="px-3 py-1.5 rounded text-sm font-semibold transition-colors"
            style={{
              backgroundColor: active ? '#FEBC11' : 'var(--surface)',
              color: active ? '#003660' : 'var(--muted)',
              border: `1px solid ${active ? '#FEBC11' : 'var(--border)'}`,
            }}
          >
            {w.label}
          </Link>
        );
      })}
    </div>
  );
}

// ── Rankings table ────────────────────────────────────────────────────────────

function RankingsTable({ entries }: { entries: PollEntry[] }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '3rem' }}>Rank</th>
              <th style={{ textAlign: 'left', paddingLeft: '1rem' }}>Team</th>
              <th title="Record" style={{ textAlign: 'center' }}>Record</th>
              <th title="Poll Points" style={{ textAlign: 'center', color: '#ffe066' }}>Pts</th>
              <th title="First Place Votes" style={{ textAlign: 'center' }}>1st</th>
              <th title="Previous Rank" style={{ textAlign: 'center' }}>Prev</th>
              <th title="Change in ranking" style={{ textAlign: 'center' }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isUCSB = entry.teamSlug === 'uc-santa-barbara';
              return (
                <tr
                  key={entry.rank}
                  style={{
                    backgroundColor: isUCSB
                      ? 'rgba(0, 54, 96, 0.5)'
                      : i % 2 !== 0
                      ? 'rgba(255,255,255,0.02)'
                      : 'transparent',
                    outline: isUCSB ? '1px solid rgba(254,188,17,0.4)' : undefined,
                  }}
                >
                  {/* Rank */}
                  <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: isUCSB ? '#FEBC11' : 'var(--text)' }}>
                    {entry.rank}
                  </td>

                  {/* Team */}
                  <td style={{ textAlign: 'left', paddingLeft: '1rem', whiteSpace: 'nowrap' }}>
                    <a
                      href={`https://mcla.us/teams/${entry.teamSlug}/2026/schedule`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: isUCSB ? '#FEBC11' : 'var(--text)',
                        fontWeight: isUCSB ? 800 : 600,
                        textDecoration: 'none',
                      }}
                      className="hover:underline"
                    >
                      {isUCSB ? '⭐ ' : ''}{entry.team}
                    </a>
                  </td>

                  {/* Record */}
                  <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {entry.record}
                  </td>

                  {/* Points */}
                  <td style={{ textAlign: 'center', fontWeight: 700, color: isUCSB ? '#FEBC11' : 'var(--text)' }}>
                    {entry.points}
                  </td>

                  {/* First place votes */}
                  <td style={{ textAlign: 'center', color: entry.firstPlaceVotes > 0 ? '#FEBC11' : 'var(--muted)' }}>
                    {entry.firstPlaceVotes > 0 ? entry.firstPlaceVotes : '—'}
                  </td>

                  {/* Previous rank */}
                  <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {entry.changeDirection === 'none' ? '—' : entry.prevRank}
                  </td>

                  {/* Change */}
                  <td style={{ textAlign: 'center' }}>
                    <ChangeBadge entry={entry} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PollsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;

  let data = null;
  try {
    data = await fetchPolls(week);
  } catch {
    // handled below
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-3xl font-black text-white mb-2">D-I Poll Rankings</h1>
        <p style={{ color: '#fca5a5' }}>Failed to load poll data. Check your network.</p>
      </div>
    );
  }

  const ucsbEntry = data.entries.find((e) => e.teamSlug === 'uc-santa-barbara');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="section-title">MCLA D-I</p>
        <h1 className="text-3xl font-black text-white mb-1">Poll Rankings</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          {data.weekLabel} · 2026 Season · {data.entries.length} teams ranked
        </p>
      </div>

      {/* UCSB callout */}
      {ucsbEntry && (
        <div
          className="flex flex-wrap items-center gap-6 rounded-xl px-6 py-4 mb-6"
          style={{
            background: 'linear-gradient(135deg, #003660 0%, #001d3d 100%)',
            border: '1px solid rgba(254,188,17,0.4)',
          }}
        >
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              UCSB · {data.weekLabel}
            </div>
            <div className="font-black text-white" style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>
              #{ucsbEntry.rank}
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Points</div>
            <div className="font-black" style={{ color: '#FEBC11', fontSize: '2rem', lineHeight: 1.1 }}>{ucsbEntry.points}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Record</div>
            <div className="font-black text-white" style={{ fontSize: '2rem', lineHeight: 1.1 }}>{ucsbEntry.record}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Change</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1 }}>
              <ChangeBadge entry={ucsbEntry} />
            </div>
          </div>
        </div>
      )}

      {/* Week selector */}
      {data.availableWeeks.length > 0 && (
        <WeekSelector weeks={data.availableWeeks} activeKey={data.weekKey} />
      )}

      {/* Rankings table */}
      {data.entries.length > 0 ? (
        <RankingsTable entries={data.entries} />
      ) : (
        <p style={{ color: 'var(--muted)' }}>No rankings available for this week yet.</p>
      )}

      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '2rem' }}>
        Data sourced from{' '}
        <a href="https://mcla.us/polls?division_id=d1" style={{ color: 'var(--gold)' }} target="_blank" rel="noopener noreferrer">
          mcla.us
        </a>
        {' '}· Cached for 1 hour
      </p>
    </div>
  );
}
