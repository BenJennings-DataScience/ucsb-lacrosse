'use client';
import { useState, useEffect } from 'react';

const HISTORICAL_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

interface HistoricalGame {
  date: string;
  opponent: string;
  is_home: boolean;
  venue: string | null;
  ucsb_score: number;
  opponent_score: number;
  is_win: boolean;
}

interface HistoricalData {
  year: number;
  record: { wins: number; losses: number } | null;
  games: HistoricalGame[];
}

function HistoricalGameRow({ game }: { game: HistoricalGame }) {
  const dateObj = new Date(game.date + 'T12:00:00'); // avoid tz offset
  const month = dateObj.toLocaleString('en-US', { month: 'short' });
  const day = dateObj.getDate();

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 rounded-xl mb-2"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Date */}
      <div
        className="text-center shrink-0"
        style={{
          backgroundColor: 'var(--navy)',
          borderRadius: '0.5rem',
          padding: '0.4rem 0.75rem',
          minWidth: '60px',
        }}
      >
        <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>
          {day}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>
          {month}
        </div>
      </div>

      {/* Opponent + venue */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-sm" style={{ color: 'var(--muted)' }}>
            {game.is_home ? 'Home vs' : 'Away @'}
          </span>
          <span className="font-bold text-white text-base">{game.opponent}</span>
        </div>
        {game.venue && (
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>
            {game.venue}
          </div>
        )}
      </div>

      {/* Score + badge */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="font-mono font-black text-lg"
          style={{ color: game.is_win ? '#86efac' : '#fca5a5' }}
        >
          {game.ucsb_score} – {game.opponent_score}
        </span>
        <span
          className="text-xs font-black px-2 py-0.5 rounded"
          style={{
            backgroundColor: game.is_win ? '#166534' : '#7f1d1d',
            color: game.is_win ? '#86efac' : '#fca5a5',
          }}
        >
          {game.is_win ? 'W' : 'L'}
        </span>
      </div>
    </div>
  );
}

export default function HistoricalSection() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/history?year=${selectedYear}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  return (
    <div className="mt-12">
      {/* Section header */}
      <div className="mb-6">
        <p className="section-title">Historical</p>
        <h2 className="text-2xl font-black text-white mb-1">Past Season Results</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          Select a season to view results
        </p>
      </div>

      {/* Year picker */}
      <div className="flex flex-wrap gap-2 mb-6">
        {HISTORICAL_YEARS.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year === selectedYear ? null : year)}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            style={{
              backgroundColor: selectedYear === year ? 'var(--gold)' : 'var(--surface)',
              color: selectedYear === year ? 'var(--navy)' : 'rgba(255,255,255,0.8)',
              border: `1px solid ${selectedYear === year ? 'var(--gold)' : 'var(--border)'}`,
              cursor: 'pointer',
            }}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ color: 'var(--muted)', padding: '2rem 0', textAlign: 'center' }}>
          Loading {selectedYear} season...
        </div>
      )}

      {error && (
        <div style={{ color: '#fca5a5', padding: '1rem 0' }}>
          Failed to load: {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Record summary */}
          {data.record && (
            <div
              className="flex gap-8 mb-5 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'inline-flex' }}
            >
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Record
                </div>
                <div className="font-black text-xl text-white">
                  {data.record.wins} – {data.record.losses}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Games
                </div>
                <div className="font-black text-xl text-white">
                  {data.games.length}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Win %
                </div>
                <div className="font-black text-xl text-white">
                  {data.games.length > 0
                    ? `${Math.round((data.record.wins / data.games.length) * 100)}%`
                    : '—'}
                </div>
              </div>
            </div>
          )}

          {data.games.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              No results found for {data.year}. Run <code>npm run import-history</code> to populate historical data.
            </p>
          ) : (
            <div>
              {data.games.map((game, i) => (
                <HistoricalGameRow key={i} game={game} />
              ))}
            </div>
          )}
        </>
      )}

      {!selectedYear && !loading && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Select a year above to view that season&apos;s results
        </div>
      )}
    </div>
  );
}
