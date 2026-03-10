'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PlayerResult {
  name: string;
  slug: string;
  position: string;
  goals: string;
  assists: string;
  points: string;
}

interface GameResult {
  opponent: string;
  month: string;
  date: string;
  day: string;
  result: string | null;
  score: string | null;
  isAway: boolean;
}

interface PositionMatch {
  code: string | null;
  players: PlayerResult[];
}

interface SearchResults {
  players: PlayerResult[];
  games: GameResult[];
  positionMatch: PositionMatch | null;
}

const POS_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: '#1e3a5f', text: '#93c5fd' },
  M: { bg: '#14532d', text: '#86efac' },
  D: { bg: '#4c1d95', text: '#c4b5fd' },
  G: { bg: '#7f1d1d', text: '#fca5a5' },
  FO: { bg: '#431407', text: '#fdba74' },
  LSM: { bg: '#1e293b', text: '#94a3b8' },
};

function PosBadge({ pos }: { pos: string }) {
  const c = POS_COLORS[pos] ?? { bg: '#1e293b', text: '#94a3b8' };
  return (
    <span
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderRadius: '0.2rem',
        padding: '1px 6px',
        fontWeight: 800,
        fontSize: '0.6rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        flexShrink: 0,
      }}
    >
      {pos}
    </span>
  );
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResults = await res.json();
      setResults(data);
      setOpen(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const hasResults =
    results &&
    (results.players.length > 0 || results.games.length > 0 || results.positionMatch !== null);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '220px' }}>
      {/* Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '0.5rem',
          padding: '0 0.6rem',
          gap: '0.4rem',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', flexShrink: 0 }}>
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (hasResults) setOpen(true); }}
          placeholder="Search players, games…"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: '0.8rem',
            width: '100%',
            padding: '0.45rem 0',
          }}
        />
        {loading && (
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', flexShrink: 0 }}>
            …
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && hasResults && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            overflow: 'hidden',
            zIndex: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: '280px',
          }}
        >
          {/* Players section */}
          {results.players.length > 0 && (
            <div>
              <div
                style={{
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  color: 'var(--gold)',
                }}
              >
                Players
              </div>
              {results.players.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => {
                    setOpen(false);
                    setQuery('');
                    router.push(`/players/${p.slug}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    textAlign: 'left' as const,
                    color: 'var(--text)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface2)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {p.position && <PosBadge pos={p.position} />}
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>{p.name}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                    {p.points} pts
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Position match section */}
          {results.positionMatch && results.positionMatch.players.length > 0 && (
            <div>
              <div
                style={{
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  color: 'var(--gold)',
                }}
              >
                By Position
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  setQuery('');
                  router.push('/stats');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  textAlign: 'left' as const,
                  color: 'var(--text)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                {results.positionMatch.code && (
                  <PosBadge pos={results.positionMatch.code} />
                )}
                <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>
                  {results.positionMatch.players.length} player{results.positionMatch.players.length !== 1 ? 's' : ''} → view in Stats
                </span>
                <span style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>→</span>
              </button>
            </div>
          )}

          {/* Games section */}
          {results.games.length > 0 && (
            <div>
              <div
                style={{
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  color: 'var(--gold)',
                }}
              >
                Games
              </div>
              {results.games.map((g, i) => {
                const opponentAnchor = g.opponent.toLowerCase().replace(/\s+/g, '-');
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                      router.push(`/schedule#${opponentAnchor}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      textAlign: 'left' as const,
                      color: 'var(--text)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface2)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--gold)',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        minWidth: '2.5rem',
                        flexShrink: 0,
                      }}
                    >
                      {g.month} {g.date}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {g.isAway ? '@ ' : 'vs '}{g.opponent}
                    </span>
                    {g.result ? (
                      <span className={g.result === 'W' ? 'badge-win' : 'badge-loss'}>
                        {g.result}
                      </span>
                    ) : (
                      <span className="badge-upcoming">TBD</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
