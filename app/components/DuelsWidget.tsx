'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const GOLD = '#FEBC11';
const NAVY = '#003660';

interface Duel {
  id: string;
  week_label: string;
  player_name: string;
  stat_type: string;
  line: number;
  game_date: string | null;
  status: string;
}

export default function DuelsWidget() {
  const [duels, setDuels] = useState<Duel[]>([]);

  useEffect(() => {
    fetch('/api/duels')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDuels(data.filter((d) => d.status === 'open').slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      style={{
        border: '1px solid #1e3a5f',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#060f1c',
      }}
    >
      <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid #1e3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="section-title" style={{ margin: 0, color: GOLD }}>
          ⚔️ This Week&apos;s Duels
        </p>
        <Link href="/duels" style={{ fontSize: 12, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
          Challenge a Gaucho →
        </Link>
      </div>

      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {duels.length === 0 ? (
          <p style={{ color: '#475569', fontSize: 13, padding: '0.5rem 0.25rem', margin: 0 }}>
            No open challenges this week.{' '}
            <Link href="/duels" style={{ color: GOLD }}>Be the first →</Link>
          </p>
        ) : (
          duels.map((d) => (
            <div
              key={d.id}
              style={{
                background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 10,
                padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
              }}
            >
              <div>
                <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: 13, margin: '0 0 2px' }}>
                  {d.player_name}
                </p>
                <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{d.week_label}</p>
              </div>
              <div
                style={{
                  background: '#060f1c', border: '1px solid #1e3a5f', borderRadius: 7,
                  padding: '5px 10px', textAlign: 'center', flexShrink: 0,
                }}
              >
                <span style={{ color: GOLD, fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{d.line}</span>
                <span style={{ color: '#64748b', fontSize: 10, display: 'block', fontWeight: 600 }}>{d.stat_type}</span>
              </div>
              <Link
                href="/duels"
                style={{
                  padding: '7px 12px', borderRadius: 7, background: GOLD, color: NAVY,
                  fontWeight: 800, fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Duel →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
