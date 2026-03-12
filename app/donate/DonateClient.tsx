'use client';

import { useState } from 'react';

const NAVY = '#003660';
const GOLD = '#FEBC11';

// ── Update these with real payment details ──────────────────────────────────
const VENMO_HANDLE = '@UCSB-MensLacrosse';
const ZELLE_EMAIL = 'ucsblacrosse@gmail.com';
const CHECK_PAYABLE = 'UCSB Men\'s Lacrosse';
const CHECK_ADDRESS = 'University of California, Santa Barbara\nSanta Barbara, CA 93106';
// ────────────────────────────────────────────────────────────────────────────

const PRESET_AMOUNTS = [25, 50, 100, 250];
type PaymentMethod = 'venmo' | 'zelle' | 'check';

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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!method) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          amount: parseFloat(amount),
          message: message.trim() || null,
          anonymous,
          payment_method: method,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a1628',
    border: '1px solid #1e3a5f',
    borderRadius: 8,
    padding: '11px 13px',
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

  const paymentInstructions: Record<PaymentMethod, React.ReactNode> = {
    venmo: (
      <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8, padding: '1rem' }}>
        <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#f8fafc', fontSize: 14 }}>
          Send via Venmo
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
          Search for <strong style={{ color: GOLD }}>{VENMO_HANDLE}</strong> on Venmo and send your
          donation amount. Include &ldquo;Lacrosse Donation&rdquo; in the note.
        </p>
      </div>
    ),
    zelle: (
      <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8, padding: '1rem' }}>
        <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#f8fafc', fontSize: 14 }}>
          Send via Zelle
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
          Send to <strong style={{ color: GOLD }}>{ZELLE_EMAIL}</strong> via your bank&apos;s Zelle
          integration. Include &ldquo;Lacrosse Donation&rdquo; in the memo.
        </p>
      </div>
    ),
    check: (
      <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8, padding: '1rem' }}>
        <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#f8fafc', fontSize: 14 }}>
          Mail a Check
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#94a3b8' }}>
          Make check payable to <strong style={{ color: GOLD }}>{CHECK_PAYABLE}</strong>
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b', whiteSpace: 'pre-line' }}>
          {CHECK_ADDRESS}
        </p>
      </div>
    ),
  };

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

      {/* ── Donation form ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <h2 style={{ color: '#f8fafc', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px' }}>
          Make a Donation
        </h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 1.75rem' }}>
          All donations are tax-deductible. You will receive an email receipt for your records.
        </p>

        {submitted ? (
          <div
            style={{
              background: '#0c1e36',
              border: `2px solid ${GOLD}`,
              borderRadius: 14,
              padding: '2.5rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎗️</div>
            <h3 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.2rem', margin: '0 0 8px' }}>
              Thank You for Your Support!
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 6px', lineHeight: 1.6 }}>
              Your donation has been recorded. A receipt will be emailed to you shortly.
            </p>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              Go Gauchos — your support keeps this program going! 🤙
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Name + Email row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Gaucho"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label style={labelStyle}>Donation Amount *</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(String(a))}
                    style={{
                      flex: '1 1 60px',
                      padding: '10px 0',
                      borderRadius: 7,
                      border: `1px solid ${amount === String(a) ? GOLD : '#1e3a5f'}`,
                      background: amount === String(a) ? GOLD : 'transparent',
                      color: amount === String(a) ? NAVY : '#94a3b8',
                      fontWeight: 700,
                      fontSize: 14,
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
                max="100000"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom amount"
                required
                style={inputStyle}
              />
            </div>

            {/* Payment method */}
            <div>
              <label style={labelStyle}>Payment Method *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['venmo', 'zelle', 'check'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 7,
                      border: `1px solid ${method === m ? GOLD : '#1e3a5f'}`,
                      background: method === m ? GOLD : 'transparent',
                      color: method === m ? NAVY : '#94a3b8',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {m === 'venmo' ? 'Venmo' : m === 'zelle' ? 'Zelle' : 'Check'}
                  </button>
                ))}
              </div>
              {/* Payment instructions */}
              {method && (
                <div style={{ marginTop: 12 }}>{paymentInstructions[method]}</div>
              )}
            </div>

            {/* Message */}
            <div>
              <label style={labelStyle}>
                Message{' '}
                <span style={{ color: '#475569', textTransform: 'none', fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="A note for the team…"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
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
              Keep my name anonymous on the donor list
            </label>

            {!method && (
              <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                * Select a payment method above to continue.
              </p>
            )}

            {submitError && (
              <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !method}
              style={{
                background: submitting || !method ? '#1e3a5f' : GOLD,
                color: submitting || !method ? '#475569' : NAVY,
                border: 'none',
                borderRadius: 8,
                padding: '14px',
                fontWeight: 800,
                fontSize: 15,
                cursor: submitting || !method ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit Donation'}
            </button>

            <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.5 }}>
              By submitting, you confirm your intent to donate the specified amount via your selected
              payment method. UCSB Men&apos;s Lacrosse will follow up with a tax receipt.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
