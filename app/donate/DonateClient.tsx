'use client';

const NAVY = '#003660';
const GOLD = '#FEBC11';

interface Props {
  stats: { totalAmount: number; donorCount: number };
}

function ImpactStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '1.75rem', fontWeight: 800, color: GOLD, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </p>
    </div>
  );
}

export default function DonateClient({ stats }: Props) {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, #001f3f 0%, #003660 60%, #001a30 100%)`,
          padding: '3rem 1.5rem 2.5rem',
          borderBottom: '1px solid #1e3a5f',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
          Support the Program
        </p>
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.75rem)',
            fontWeight: 900,
            color: '#f8fafc',
            margin: '0 0 12px',
            lineHeight: 1.1,
          }}
        >
          Invest in UCSB<br />
          <span style={{ color: GOLD }}>Men&apos;s Lacrosse</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: 560, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
          Founded in 1969 and two-time national champions, the UCSB Gauchos compete in the MCLA
          as a club program. Your tax-deductible donation funds travel, equipment, tournament
          entry fees, and everything that keeps this storied program on the field.
        </p>

        {/* Heritage badges */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {['Founded 1969', '2× National Champions', '501(c)(3) Tax-Deductible'].map((badge) => (
            <span
              key={badge}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(254,188,17,0.12)',
                border: `1px solid rgba(254,188,17,0.3)`,
                color: GOLD,
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ── Impact stats ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1.5rem',
          padding: '1.75rem 1.5rem',
          borderBottom: '1px solid #1e3a5f',
          background: '#060f1c',
        }}
      >
        <ImpactStat
          value={stats.totalAmount > 0 ? `$${stats.totalAmount.toLocaleString()}` : '—'}
          label="Raised in 2026"
        />
        <ImpactStat
          value={stats.donorCount > 0 ? String(stats.donorCount) : '—'}
          label="Donors"
        />
        <ImpactStat value="57" label="Years of Gaucho Lax" />
        <ImpactStat value="2×" label="National Champions" />
      </div>

      {/* ── What donations fund ───────────────────────────────────────────── */}
      <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid #1e3a5f', background: '#060f1c' }}>
        <h2 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          What Your Donation Funds
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {[
            { icon: '✈️', label: 'Travel & Transportation', desc: 'Away game travel, hotels, and fuel' },
            { icon: '🥍', label: 'Equipment & Gear', desc: 'Sticks, pads, helmets, and uniforms' },
            { icon: '🏆', label: 'Tournament Entry Fees', desc: 'MCLA registration and tournament costs' },
            { icon: '🏟️', label: 'Practice & Field Costs', desc: 'Field reservations and facilities' },
          ].map(({ icon, label, desc }) => (
            <div
              key={label}
              style={{
                background: '#0a1628',
                border: '1px solid #1e3a5f',
                borderRadius: 10,
                padding: '0.9rem',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{icon}</span>
              <p style={{ margin: '6px 0 2px', fontWeight: 700, fontSize: 14, color: '#f8fafc' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Donate button ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2.5rem 1.5rem 4rem', textAlign: 'center' }}>
        <a
          href="https://gaucho-lacrosse-alumni-association.square.site/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            background: GOLD,
            color: NAVY,
            border: 'none',
            borderRadius: 10,
            padding: '16px 48px',
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: '0.03em',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Donate
        </a>
      </div>
    </div>
  );
}
