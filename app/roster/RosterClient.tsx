'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { RosterApiPlayer } from '@/app/api/roster/route';

const NAVY = '#003660';
const GOLD = '#FEBC11';

const POS_FILTERS = ['All', 'Attack', 'Midfield', 'Defense', 'Goalie'] as const;
type PosFilter = (typeof POS_FILTERS)[number];

const POS_ABBR: Record<string, string> = {
  // Full names from MCLA roster page
  Attack: 'Attack',
  Midfield: 'Midfield',
  Defense: 'Defense',
  Goalie: 'Goalie',
  LSM: 'Midfield',
  SSDM: 'Midfield',
  FOS: 'Midfield',
  FO: 'Midfield',
  // Abbreviations from stats page
  A: 'Attack',
  M: 'Midfield',
  D: 'Defense',
  G: 'Goalie',
};

function matchesFilter(position: string, filter: PosFilter): boolean {
  if (filter === 'All') return true;
  return POS_ABBR[position] === filter;
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(254,188,17,0.1)',
        border: '1px solid rgba(254,188,17,0.25)',
        borderRadius: 6,
        padding: '3px 8px',
        minWidth: 36,
      }}
    >
      <span style={{ color: GOLD, fontWeight: 800, fontSize: 14, lineHeight: 1 }}>{value}</span>
      <span style={{ color: '#64748b', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>{label}</span>
    </span>
  );
}

function PlayerCard({ player }: { player: RosterApiPlayer }) {
  const posLabel = POS_ABBR[player.position] ?? player.position;
  const classShort = player.classYear.replace('Freshman', 'Fr').replace('Sophomore', 'So').replace('Junior', 'Jr').replace('Senior', 'Sr').replace('Graduate', 'Gr');

  return (
    <Link
      href={`/players/${player.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          background: '#0a1628',
          border: '1px solid #1e3a5f',
          borderRadius: 12,
          padding: '1rem',
          height: '100%',
          cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.15s',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = GOLD;
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#1e3a5f';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Jersey number — top right watermark */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            fontSize: 40,
            fontWeight: 900,
            color: 'rgba(254,188,17,0.12)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {player.jersey}
        </span>

        {/* Jersey number badge */}
        <span
          style={{
            display: 'inline-block',
            background: GOLD,
            color: NAVY,
            fontWeight: 900,
            fontSize: 11,
            borderRadius: 5,
            padding: '2px 7px',
            marginBottom: 8,
            letterSpacing: '0.04em',
          }}
        >
          #{player.jersey}
        </span>

        {/* Name */}
        <p style={{ color: '#f8fafc', fontWeight: 800, fontSize: 15, margin: '0 0 3px', lineHeight: 1.2 }}>
          {player.name}
        </p>

        {/* Position · Class */}
        <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 8px', fontWeight: 600 }}>
          {posLabel}{classShort ? ` · ${classShort}` : ''}
        </p>

        {/* Hometown */}
        {player.hometown && (
          <p style={{ color: '#475569', fontSize: 11, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>📍</span> {player.hometown}
          </p>
        )}

        {/* Stat badges */}
        {player.gp > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <StatBadge label="G" value={player.goals} />
            <StatBadge label="A" value={player.assists} />
            <StatBadge label="PTS" value={player.points} />
            <StatBadge label="GP" value={player.gp} />
          </div>
        )}
        {player.gp === 0 && (
          <span style={{ fontSize: 11, color: '#334155' }}>No stats yet</span>
        )}
      </div>
    </Link>
  );
}

const COACH_PHOTO = 'https://cdn.ussportscamps.com/craftcms/media/images/lacrosse/nike/coaches/_250x300_crop_top-center_85_none/61262/mike-allan-santa-barbara-lacrosse-camp.webp';

function CoachAvatar() {
  const [imgFailed, setImgFailed] = useState(false);
  if (imgFailed) {
    return (
      <div
        style={{
          width: 72, height: 72, borderRadius: '50%',
          background: NAVY, border: `2px solid ${GOLD}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <span style={{ color: GOLD, fontWeight: 900, fontSize: 22 }}>MA</span>
      </div>
    );
  }
  return (
    <div style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid ${GOLD}`, overflow: 'hidden', flexShrink: 0 }}>
      <img
        src={COACH_PHOTO}
        alt="Coach Mike Allan"
        width={72}
        height={72}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

function CoachesTab() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div
        style={{
          background: '#0a1628',
          border: '1px solid #1e3a5f',
          borderRadius: 16,
          overflow: 'hidden',
          borderLeft: `4px solid ${GOLD}`,
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.75rem 1.75rem 1.25rem', borderBottom: '1px solid #1e3a5f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Avatar */}
            <CoachAvatar />

            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                Head Coach
              </p>
              <h2 style={{ color: '#f8fafc', fontWeight: 900, fontSize: '1.5rem', margin: 0, lineHeight: 1.1 }}>
                Mike Allan
              </h2>
              <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>UC Santa Barbara Gauchos</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            Mike Allan is one of the most decorated coaches in MCLA history. A Baltimore native who attended the prestigious Gilman School, Allan went on to play at Princeton University — where he was part of three NCAA National Championship teams.
          </p>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            He first took the helm at UCSB from 2004 to 2008, guiding the Gauchos to back-to-back MCLA National Championships and three WCLL Conference titles — cementing UC Santa Barbara as a powerhouse of collegiate club lacrosse.
          </p>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            After broadening his coaching horizons as an assistant at Towson University for three years, Allan returned to Santa Barbara to continue building the program he helped define. His deep roots in both the Ivy League and the MCLA make him one of the most respected voices in the game.
          </p>
        </div>

        {/* Stat strip */}
        <div
          style={{
            background: '#060f1c',
            borderTop: '1px solid #1e3a5f',
            padding: '1rem 1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {[
            { icon: '🏆', label: '2x MCLA National Champion' },
            { icon: '🏆', label: '3x WCLL Champion' },
            { icon: '🎓', label: 'Princeton University Alumni' },
          ].map(({ icon, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
              <span>{icon}</span>
              <span style={{ color: '#cbd5e1' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RosterClient({ players }: { players: RosterApiPlayer[] }) {
  const [tab, setTab] = useState<'players' | 'coaches'>('players');
  const [posFilter, setPosFilter] = useState<PosFilter>('All');

  const filtered = players.filter((p) => matchesFilter(p.position, posFilter));

  return (
    <>
      {/* Tabs */}
      <div
        style={{
          background: NAVY,
          borderBottom: '1px solid #1e3a5f',
          padding: '0 1.5rem',
          display: 'flex',
          gap: 0,
        }}
      >
        {(['players', 'coaches'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? `3px solid ${GOLD}` : '3px solid transparent',
              color: tab === t ? '#f8fafc' : 'rgba(255,255,255,0.5)',
              fontWeight: 800,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {t === 'players' ? `Players (${players.length})` : 'Coaches'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {tab === 'players' && (
          <>
            {/* Position filter */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {POS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setPosFilter(f)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    border: `1px solid ${posFilter === f ? GOLD : '#1e3a5f'}`,
                    background: posFilter === f ? GOLD : 'transparent',
                    color: posFilter === f ? NAVY : '#94a3b8',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {f}
                </button>
              ))}
              {posFilter !== 'All' && (
                <span style={{ fontSize: 12, color: '#475569', alignSelf: 'center', marginLeft: 4 }}>
                  {filtered.length} player{filtered.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              {filtered.map((p) => (
                <PlayerCard key={p.slug} player={p} />
              ))}
            </div>

            {filtered.length === 0 && (
              <p style={{ color: '#475569', textAlign: 'center', padding: '3rem 0' }}>
                No players match this filter.
              </p>
            )}
          </>
        )}

        {tab === 'coaches' && <CoachesTab />}
      </div>
    </>
  );
}
