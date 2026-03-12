'use client';

import { useCallback, useEffect, useState } from 'react';

const NAVY = '#003660';
const GOLD = '#FEBC11';

interface Duel {
  id: string;
  week_label: string;
  player_name: string;
  stat_type: string;
  line: number;
  actual_result: number | null;
  status: string;
  game_date: string | null;
  context: string | null;
  created_at: string;
}

interface Matchup {
  id: string;
  duel_id: string;
  challenger_name: string;
  challenger_email: string | null;
  challenger_side: string;
  opponent_name: string;
  opponent_email: string | null;
  pledge_amount: number;
  status: string;
  loser_paid: boolean;
  created_at: string;
}

interface ModalState {
  duel: Duel;
  side: 'over' | 'under';
}

interface LeaderboardEntry {
  name: string;
  wins: number;
  losses: number;
  totalDonated: number;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatGameDateLine(iso: string | null, weekLabel: string): string {
  if (!iso) return weekLabel;
  try {
    // Parse as local date (YYYY-MM-DD) to avoid UTC shift
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `📅 ${day} ${monthDay} · ${weekLabel}`;
  } catch {
    return weekLabel;
  }
}

function isFutureOrToday(iso: string | null): boolean {
  if (!iso) return true; // no date = show it
  const [y, m, d] = iso.split('-').map(Number);
  const gameDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return gameDate >= today;
}

function buildLeaderboard(matchups: Matchup[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();

  function get(name: string): LeaderboardEntry {
    if (!map.has(name)) map.set(name, { name, wins: 0, losses: 0, totalDonated: 0 });
    return map.get(name)!;
  }

  for (const m of matchups) {
    const resolved = m.status === 'challenger_won' || m.status === 'opponent_won';
    if (!resolved) continue;

    const challengerWon = m.status === 'challenger_won';
    const winner = challengerWon ? m.challenger_name : m.opponent_name;
    const loser = challengerWon ? m.opponent_name : m.challenger_name;

    get(winner).wins += 1;
    get(loser).losses += 1;
    get(loser).totalDonated += Number(m.pledge_amount);
  }

  return Array.from(map.values()).sort((a, b) => b.wins - a.wins || a.losses - b.losses);
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ChallengeModal({
  modal,
  onClose,
  onSuccess,
}: {
  modal: ModalState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [challengerName, setChallengerName] = useState('');
  const [challengerEmail, setChallengerEmail] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [opponentEmail, setOpponentEmail] = useState('');
  const [pledgeAmount, setPledgeAmount] = useState('25');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const PRESETS = [10, 25, 50, 100];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/duel-matchups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duel_id: modal.duel.id,
          challenger_name: challengerName.trim(),
          challenger_email: challengerEmail.trim() || null,
          challenger_side: modal.side,
          opponent_name: opponentName.trim(),
          opponent_email: opponentEmail.trim() || null,
          pledge_amount: parseFloat(pledgeAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a1628',
    border: '1px solid #1e3a5f',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#f8fafc',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 5,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#0c1e36',
          border: `1px solid ${GOLD}`,
          borderRadius: 16,
          padding: '1.75rem',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚔️</div>
            <h3 style={{ color: '#f8fafc', fontWeight: 800, margin: '0 0 8px' }}>Challenge Issued!</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
              The gauntlet has been thrown. Honor the pledge.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
                Donation Challenge
              </p>
              <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 4px' }}>
                {modal.duel.player_name} — {modal.duel.line} {modal.duel.stat_type}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                You&apos;re taking the{' '}
                <strong style={{ color: GOLD }}>{modal.side.toUpperCase()}</strong>{' '}
                ({modal.side === 'over' ? `>${modal.duel.line}` : `<${modal.duel.line}`} {modal.duel.stat_type.toLowerCase()})
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input required value={challengerName} onChange={(e) => setChallengerName(e.target.value)}
                    placeholder="Jane Gaucho" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Your Email</label>
                  <input type="email" value={challengerEmail} onChange={(e) => setChallengerEmail(e.target.value)}
                    placeholder="you@example.com" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Opponent&apos;s Name *</label>
                  <input required value={opponentName} onChange={(e) => setOpponentName(e.target.value)}
                    placeholder="Rival Gaucho" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Opponent&apos;s Email</label>
                  <input type="email" value={opponentEmail} onChange={(e) => setOpponentEmail(e.target.value)}
                    placeholder="them@example.com" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Pledge Amount * ($10 min)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  {PRESETS.map((a) => (
                    <button key={a} type="button" onClick={() => setPledgeAmount(String(a))}
                      style={{
                        flex: '1 1 50px', padding: '8px 0', borderRadius: 7,
                        border: `1px solid ${pledgeAmount === String(a) ? GOLD : '#1e3a5f'}`,
                        background: pledgeAmount === String(a) ? GOLD : 'transparent',
                        color: pledgeAmount === String(a) ? NAVY : '#94a3b8',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>
                <input type="number" min="10" step="1" required value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(e.target.value)}
                  placeholder="Custom amount" style={inputStyle} />
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={onClose}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #1e3a5f',
                    background: 'transparent', color: '#94a3b8', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 8, border: 'none',
                    background: submitting ? '#1e3a5f' : GOLD,
                    color: submitting ? '#475569' : NAVY,
                    fontWeight: 800, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
                  }}>
                  {submitting ? 'Locking In…' : '⚔️ Issue Challenge'}
                </button>
              </div>

              <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Gaucho Duel is a voluntary donation challenge. The loser donates their pledge directly
                to UCSB Men&apos;s Lacrosse. No money is exchanged between participants.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Prop Card ─────────────────────────────────────────────────────────────────

function PropCard({
  duel,
  matchups,
  onChallenge,
}: {
  duel: Duel;
  matchups: Matchup[];
  onChallenge: (duel: Duel, side: 'over' | 'under') => void;
}) {
  const relevant = matchups.filter((m) => m.duel_id === duel.id);
  const overCount = relevant.filter((m) => m.challenger_side === 'over').length;
  const underCount = relevant.filter((m) => m.challenger_side === 'under').length;
  const totalPledged = relevant.reduce((s, m) => s + Number(m.pledge_amount), 0);
  const [expanded, setExpanded] = useState(false);
  const [losingId, setLosingId] = useState<string | null>(null);

  async function handleLost(matchupId: string) {
    setLosingId(matchupId);
    try {
      await fetch('/api/duel-matchups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: matchupId }),
      });
      window.location.href = '/donate';
    } catch {
      setLosingId(null);
    }
  }

  const isOpen = duel.status === 'open';
  const isLocked = duel.status === 'locked';
  const isResolved = duel.status === 'resolved';

  return (
    <div
      style={{
        background: '#0a1628',
        border: '1px solid #1e3a5f',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid #1e3a5f' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
              {formatGameDateLine(duel.game_date, duel.week_label)}
            </p>
            <h3 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
              {duel.player_name}
            </h3>
          </div>
          <span
            style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: isOpen ? 'rgba(254,188,17,0.12)' : isLocked ? 'rgba(239,68,68,0.12)' : 'rgba(100,116,139,0.2)',
              border: `1px solid ${isOpen ? 'rgba(254,188,17,0.3)' : isLocked ? 'rgba(239,68,68,0.3)' : '#334155'}`,
              color: isOpen ? GOLD : isLocked ? '#f87171' : '#64748b',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {isOpen ? 'OPEN' : isLocked ? 'LOCKED' : 'RESOLVED'}
          </span>
        </div>

        {/* Stat line */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 6,
            background: '#060f1c', border: '1px solid #1e3a5f', borderRadius: 8, padding: '8px 14px',
          }}
        >
          <span style={{ color: GOLD, fontWeight: 900, fontSize: '1.75rem', lineHeight: 1 }}>{duel.line}</span>
          <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>{duel.stat_type}</span>
        </div>

        {isResolved && duel.actual_result !== null && (
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '8px 0 0' }}>
            Actual: <strong style={{ color: '#f8fafc' }}>{duel.actual_result} {duel.stat_type}</strong>
            {' — '}
            {Number(duel.actual_result) > duel.line ? (
              <span style={{ color: '#4ade80' }}>OVER wins</span>
            ) : (
              <span style={{ color: '#f87171' }}>UNDER wins</span>
            )}
          </p>
        )}

        {/* Context blurb */}
        {duel.context && (
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.55, margin: '10px 0 0', fontStyle: 'italic' }}>
            {duel.context}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            <strong style={{ color: '#f8fafc' }}>{overCount}</strong> Over ·{' '}
            <strong style={{ color: '#f8fafc' }}>{underCount}</strong> Under
          </span>
          {totalPledged > 0 && (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              <strong style={{ color: GOLD }}>${totalPledged}</strong> pledged
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {isOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem' }}>
          <button
            onClick={() => onChallenge(duel, 'over')}
            style={{
              padding: '10px', borderRadius: 8, border: `1px solid ${GOLD}`,
              background: GOLD, color: NAVY, fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}
          >
            I&apos;ll Take the OVER
          </button>
          <button
            onClick={() => onChallenge(duel, 'under')}
            style={{
              padding: '10px', borderRadius: 8, border: '1px solid #1e3a5f',
              background: 'transparent', color: '#f8fafc', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}
          >
            I&apos;ll Take the UNDER
          </button>
        </div>
      )}

      {/* Active matchups */}
      {relevant.length > 0 && (
        <div style={{ borderTop: '1px solid #1e3a5f' }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none',
              color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between',
            }}
          >
            <span>{relevant.length} active challenge{relevant.length !== 1 ? 's' : ''}</span>
            <span>{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && (
            <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {relevant.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: '#060f1c', border: '1px solid #1e3a5f', borderRadius: 8,
                    padding: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: 13, margin: '0 0 2px' }}>
                        <span style={{ color: GOLD }}>{m.challenger_name}</span>
                        <span style={{ color: '#64748b' }}> (
                          <span style={{ color: m.challenger_side === 'over' ? '#4ade80' : '#f87171' }}>
                            {m.challenger_side.toUpperCase()}
                          </span>
                        ) vs </span>
                        {m.opponent_name}
                      </p>
                      <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>
                        ${m.pledge_amount} pledge · {m.loser_paid ? '✅ Honored' : 'Pending'}
                      </p>
                    </div>
                    {!m.loser_paid && isResolved && (
                      <button
                        onClick={() => handleLost(m.id)}
                        disabled={losingId === m.id}
                        style={{
                          padding: '6px 10px', borderRadius: 6, border: '1px solid #7f1d1d',
                          background: 'rgba(127,29,29,0.3)', color: '#fca5a5',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {losingId === m.id ? '…' : 'I Lost 😤'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DuelsClient() {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);

  const load = useCallback(async () => {
    const [d, m] = await Promise.all([
      fetch('/api/duels').then((r) => r.json()),
      fetch('/api/duel-matchups').then((r) => r.json()),
    ]);
    if (Array.isArray(d)) setDuels(d);
    if (Array.isArray(m)) setMatchups(m);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDuels = duels.filter((d) => d.status === 'open' && isFutureOrToday(d.game_date));
  const lockedDuels = duels.filter((d) => d.status === 'locked');
  const resolvedDuels = duels.filter((d) => d.status === 'resolved');
  const leaderboard = buildLeaderboard(matchups);

  return (
    <>
      {modal && (
        <ChallengeModal
          modal={modal}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}

      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001f3f 0%, #003660 60%, #001a30 100%)',
          padding: '3rem 1.5rem 2.5rem',
          borderBottom: '1px solid #1e3a5f',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
          Donation Challenge
        </p>
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.75rem)', fontWeight: 900,
            color: '#f8fafc', margin: '0 0 12px', lineHeight: 1.1,
          }}
        >
          ⚔️ Gaucho Duel
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: 560, margin: '0 0 0.5rem', lineHeight: 1.6 }}>
          Lock in against a fellow Gaucho. Loser donates to the program. Winner earns eternal bragging rights.
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {loading && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>Loading the prop board…</p>
        )}

        {/* Open Props */}
        {!loading && (
          <>
            <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              📋 Prop Board
            </h2>

            {openDuels.length === 0 ? (
              <div
                style={{
                  background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 14,
                  padding: '2rem', textAlign: 'center', marginBottom: '2rem',
                }}
              >
                <p style={{ color: '#f8fafc', fontWeight: 700, margin: '0 0 6px' }}>No Active Props</p>
                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                  The next game&apos;s prop board hasn&apos;t dropped yet. Check back closer to game day.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {openDuels.map((d) => (
                  <PropCard key={d.id} duel={d} matchups={matchups} onChallenge={(duel, side) => setModal({ duel, side })} />
                ))}
              </div>
            )}

            {/* Locked */}
            {lockedDuels.length > 0 && (
              <>
                <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🔒 Locked In
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {lockedDuels.map((d) => (
                    <PropCard key={d.id} duel={d} matchups={matchups} onChallenge={(duel, side) => setModal({ duel, side })} />
                  ))}
                </div>
              </>
            )}

            {/* Resolved */}
            {resolvedDuels.length > 0 && (
              <>
                <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ✅ Resolved
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {resolvedDuels.map((d) => (
                    <PropCard key={d.id} duel={d} matchups={matchups} onChallenge={(duel, side) => setModal({ duel, side })} />
                  ))}
                </div>
              </>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <>
                <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🏆 Leaderboard
                </h2>
                <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 14, overflow: 'hidden', marginBottom: '2rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1e3a5f' }}>
                        {['Alumni', 'W', 'L', 'Donated'].map((h) => (
                          <th key={h} style={{ padding: '0.75rem 1rem', textAlign: h === 'Alumni' ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((row, i) => (
                        <tr key={row.name} style={{ borderBottom: '1px solid #0d1f36', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                          <td style={{ padding: '0.75rem 1rem', color: '#f8fafc', fontWeight: 600, fontSize: 14 }}>
                            {i === 0 && '👑 '}{row.name}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#4ade80', fontWeight: 700 }}>{row.wins}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#f87171', fontWeight: 700 }}>{row.losses}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: GOLD, fontWeight: 700 }}>
                            {row.totalDonated > 0 ? `$${row.totalDonated}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Disclaimer */}
            <div
              style={{
                background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 10,
                padding: '1rem 1.25rem',
              }}
            >
              <p style={{ color: '#475569', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                <strong style={{ color: '#64748b' }}>Disclaimer:</strong> Gaucho Duel is a voluntary donation challenge.
                All payments are made directly to UCSB Men&apos;s Lacrosse, a registered 501(c)(3).
                No money is exchanged between participants.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
