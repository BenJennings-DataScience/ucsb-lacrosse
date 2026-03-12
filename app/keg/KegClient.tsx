'use client';

import { useEffect, useState, useCallback } from 'react';
import type { KegGame } from '@/app/api/keg-pledges/route';

const KEG_GOAL = 125;
const NAVY = '#003660';
const GOLD = '#FEBC11';
const QUICK_AMOUNTS = [5, 10, 25, 50];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProgressBar({ pledged }: { pledged: number }) {
  const pct = Math.min((pledged / KEG_GOAL) * 100, 100);
  const secured = pledged >= KEG_GOAL;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Keg fund</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: secured ? GOLD : '#94a3b8' }}>
          ${pledged.toFixed(0)} / ${KEG_GOAL}
        </span>
      </div>
      <div style={{ height: 8, background: '#1e3a5f', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: GOLD,
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function KegClient() {
  const [games, setGames] = useState<KegGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  // Form state
  const [gameId, setGameId] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [venmo, setVenmo] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const loadGames = useCallback(async () => {
    try {
      const res = await fetch('/api/keg-pledges');
      if (!res.ok) throw new Error('Failed to load');
      setGames(await res.json());
      setFetchError(null);
    } catch {
      setFetchError('Could not load keg data. Make sure the database is set up.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gameId || !name.trim() || !amount) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/keg-pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          name: name.trim(),
          amount: parseFloat(amount),
          venmo_handle: venmo.trim() || null,
          anonymous,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }
      setSubmitted(true);
      setName('');
      setAmount('');
      setVenmo('');
      setAnonymous(false);
      setGameId('');
      await loadGames();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const kegsSecured = games.filter((g) => g.totalPledged >= KEG_GOAL).length;

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
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  };

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ padding: '1.5rem 1rem 1rem' }}>
        <p className="section-title">Alumni & Fan Feature</p>
        <h1 className="text-3xl font-black text-white">Fund a Keg 🍺</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 2 }}>
          Help the Gauchos celebrate in style after a big win
        </p>

        {/* Season keg count badge */}
        {!loading && !fetchError && (
          <div
            style={{
              display: 'inline-block',
              marginTop: '0.75rem',
              background: kegsSecured > 0 ? GOLD : '#0f2035',
              color: kegsSecured > 0 ? NAVY : '#475569',
              border: `1px solid ${kegsSecured > 0 ? GOLD : '#1e3a5f'}`,
              padding: '5px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {kegsSecured > 0
              ? `🍺 ${kegsSecured} keg${kegsSecured !== 1 ? 's' : ''} funded this season!`
              : 'No kegs funded yet — be the first!'}
          </div>
        )}
      </div>

      {/* ── Loading / error ────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading keg status…
        </div>
      )}
      {fetchError && (
        <div
          style={{
            margin: '0 1rem',
            padding: '1rem',
            background: '#1c0a0a',
            border: '1px solid #7f1d1d',
            borderRadius: 10,
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          {fetchError}
        </div>
      )}

      {/* ── Game cards grid ───────────────────────────────────────────────── */}
      {!loading && !fetchError && (
        <>
          {games.length === 0 ? (
            <p style={{ padding: '1rem', color: '#64748b', fontSize: 14 }}>
              No games found. Games sync from the live schedule — check back after the first game.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1rem',
                padding: '0 1rem',
              }}
            >
              {games.map((game) => {
                const secured = game.totalPledged >= KEG_GOAL;
                const isExpanded = expandedGame === game.id;
                return (
                  <div
                    key={game.id}
                    style={{
                      background: '#0a1628',
                      border: `1px solid ${secured ? GOLD : '#1e3a5f'}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {/* KEG SECURED banner */}
                    {secured && (
                      <div
                        style={{
                          background: GOLD,
                          color: NAVY,
                          padding: '6px 12px',
                          fontWeight: 800,
                          fontSize: 12,
                          textAlign: 'center',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        🍺 Keg Secured!
                      </div>
                    )}

                    <div style={{ padding: '0.9rem' }}>
                      {/* Game info row */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>
                            {game.is_home ? 'vs.' : '@'} {game.opponent}
                          </p>
                          {game.ucsb_score !== null && (
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>
                              UCSB&nbsp;{game.ucsb_score}–{game.opponent_score}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{formatDate(game.date)}</span>
                          {game.is_win !== null && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: game.is_win ? '#14532d' : '#450a0a',
                                color: game.is_win ? '#4ade80' : '#f87171',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {game.is_win ? 'W' : 'L'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <ProgressBar pledged={game.totalPledged} />

                      {/* Contributors toggle */}
                      {game.pledgeCount > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <button
                            onClick={() => setExpandedGame(isExpanded ? null : game.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 12,
                              color: GOLD,
                              padding: 0,
                              fontWeight: 600,
                            }}
                          >
                            {isExpanded
                              ? '▲ Hide contributors'
                              : `▼ ${game.pledgeCount} contributor${game.pledgeCount !== 1 ? 's' : ''}`}
                          </button>
                          {isExpanded && (
                            <div
                              style={{
                                marginTop: 8,
                                borderTop: '1px solid #1e3a5f',
                                paddingTop: 8,
                              }}
                            >
                              {game.contributors.map((c, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 12,
                                    color: '#cbd5e1',
                                    padding: '3px 0',
                                  }}
                                >
                                  <span>{c.name}</span>
                                  <span style={{ color: GOLD, fontWeight: 600 }}>
                                    ${c.amount.toFixed(0)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pledge form ─────────────────────────────────────────────────── */}
          <div
            style={{
              maxWidth: 480,
              margin: '2.5rem auto',
              padding: '0 1rem 3rem',
            }}
          >
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px' }}>
              Make a Pledge
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 1.5rem' }}>
              Pledge an amount toward a keg for any game. We&apos;ll collect via Venmo once the goal is hit.
            </p>

            {submitted ? (
              <div
                style={{
                  background: '#052e16',
                  border: '1px solid #166534',
                  borderRadius: 12,
                  padding: '2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🍺</div>
                <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>
                  Pledge received!
                </p>
                <p style={{ color: '#86efac', fontSize: 13, margin: '0 0 1rem' }}>
                  Let&apos;s get this keg funded — go Gauchos!
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  style={{
                    background: 'none',
                    border: '1px solid #166534',
                    color: '#4ade80',
                    borderRadius: 6,
                    padding: '6px 18px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Pledge for another game
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Game selector */}
                <div>
                  <label style={labelStyle}>Game *</label>
                  <select
                    required
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">Select a game…</option>
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>
                        {formatDate(g.date)} — {g.is_home ? 'vs.' : '@'} {g.opponent}
                        {g.totalPledged >= KEG_GOAL ? ' 🍺' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Gaucho Fan"
                    style={inputStyle}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label style={labelStyle}>Amount *</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmount(String(a))}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: 6,
                          border: `1px solid ${amount === String(a) ? GOLD : '#1e3a5f'}`,
                          background: amount === String(a) ? GOLD : 'transparent',
                          color: amount === String(a) ? NAVY : '#94a3b8',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        ${a}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Custom amount"
                    style={inputStyle}
                  />
                </div>

                {/* Venmo handle */}
                <div>
                  <label style={labelStyle}>
                    Venmo Handle{' '}
                    <span style={{ color: '#475569', textTransform: 'none', fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={venmo}
                    onChange={(e) => setVenmo(e.target.value)}
                    placeholder="@your-venmo"
                    style={inputStyle}
                  />
                </div>

                {/* Anonymous */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    color: '#94a3b8',
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    style={{ accentColor: GOLD, width: 16, height: 16, cursor: 'pointer' }}
                  />
                  Show as &quot;Anonymous Gaucho&quot; on the leaderboard
                </label>

                {submitError && (
                  <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? '#1e3a5f' : GOLD,
                    color: submitting ? '#475569' : NAVY,
                    border: 'none',
                    borderRadius: 8,
                    padding: '13px',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  {submitting ? 'Pledging…' : 'Pledge for a Keg 🍺'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
