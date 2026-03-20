'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const NAVY = '#003660';
const GOLD = '#FEBC11';

export interface SafeAlumni {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  grad_decade: string | null;
  bio: string | null;
  linkedin_url: string | null;
  open_to_networking: boolean;
  is_parent: boolean;
  tags: string[] | null;
}

export interface AlumniStats {
  total: number;
  totalDonors: number;
  totalDonated2023: number;
  totalDonated2024: number;
  pctNetworking: number;
  decadeCounts: { decade: string; count: number }[];
}

type TabId = 'directory' | 'decade' | 'stats';
type FilterChip = 'All' | 'Alumni' | 'Parents' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';

const FILTER_CHIPS: FilterChip[] = ['All', 'Alumni', 'Parents', '1980s', '1990s', '2000s', '2010s', '2020s'];

function fullName(a: SafeAlumni): string {
  return [a.first_name, a.last_name].filter(Boolean).join(' ') || '(No name)';
}

// ── LinkedIn Modal ────────────────────────────────────────────────────────────

function LinkedInModal({ alumni, onClose, onSaved }: {
  alumni: SafeAlumni;
  onClose: () => void;
  onSaved: (id: string, url: string) => void;
}) {
  const [url, setUrl] = useState(alumni.linkedin_url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/alumni/linkedin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alumni.id, linkedin_url: url.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaved(alumni.id, url.trim());
      onClose();
    } catch {
      setError('Save failed — try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#0c1e36', border: `1px solid ${GOLD}`, borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 420 }}>
        <h3 style={{ color: '#f8fafc', fontWeight: 800, margin: '0 0 6px' }}>Add LinkedIn</h3>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px' }}>{fullName(alumni)}</p>
        <input
          type="url"
          placeholder="https://linkedin.com/in/username"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '100%', background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#f8fafc', fontSize: 14, boxSizing: 'border-box', outline: 'none', marginBottom: 12 }}
        />
        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #1e3a5f', background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: saving ? '#1e3a5f' : GOLD, color: saving ? '#475569' : NAVY, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Alumni Card ───────────────────────────────────────────────────────────────

function AlumniCard({ alumni, onAddLinkedIn }: {
  alumni: SafeAlumni;
  onAddLinkedIn: (a: SafeAlumni) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const name = fullName(alumni);
  const initials = [alumni.first_name?.[0], alumni.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div
      style={{
        background: '#0a1628',
        border: '1px solid #1e3a5f',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: alumni.bio ? 'pointer' : 'default',
      }}
      onClick={() => alumni.bio && setExpanded((v) => !v)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: NAVY, border: `1px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: GOLD, fontWeight: 800, fontSize: 13 }}>{initials}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{ color: '#f8fafc', fontWeight: 800, fontSize: 14, margin: 0 }}>{name}</p>
            {alumni.open_to_networking && (
              <span title="Open to networking" style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0, display: 'inline-block' }} />
            )}
            {alumni.is_parent && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#93c5fd', background: 'rgba(147,197,253,0.1)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                Parent
              </span>
            )}
          </div>

          {alumni.grad_decade && (
            <span style={{ display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 700, color: NAVY, background: GOLD, borderRadius: 4, padding: '1px 7px', letterSpacing: '0.04em' }}>
              {alumni.grad_decade}
            </span>
          )}
        </div>
      </div>

      {/* Company / role */}
      {(alumni.job_title || alumni.company) && (
        <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
          {[alumni.job_title, alumni.company].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Industry */}
      {alumni.industry && (
        <span style={{ alignSelf: 'flex-start', fontSize: 10, fontWeight: 700, color: '#64748b', background: '#0d1f36', border: '1px solid #1e3a5f', borderRadius: 4, padding: '2px 8px' }}>
          {alumni.industry}
        </span>
      )}

      {/* Bio (expandable) */}
      {expanded && alumni.bio && (
        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: 0, borderTop: '1px solid #1e3a5f', paddingTop: 8 }}>
          {alumni.bio}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        {alumni.linkedin_url ? (
          <a
            href={alumni.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAddLinkedIn(alumni); }}
            style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            + Add LinkedIn
          </button>
        )}
      </div>
    </div>
  );
}

// ── Decade Map Tab ────────────────────────────────────────────────────────────

function DecadeMapTab({ decadeCounts }: { decadeCounts: { decade: string; count: number }[] }) {
  const max = Math.max(...decadeCounts.map((d) => d.count), 1);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 1.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Alumni by Graduation Decade
      </h2>
      <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 14, padding: '1.5rem' }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={decadeCounts} margin={{ top: 20, right: 16, left: 0, bottom: 8 }}>
            <XAxis dataKey="decade" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0c1e36', border: '1px solid #1e3a5f', borderRadius: 8, color: '#f8fafc' }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              formatter={(v) => [v, 'Alumni']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {decadeCounts.map((entry, i) => (
                <Cell key={i} fill={entry.decade === 'Unknown' ? '#1e3a5f' : GOLD} opacity={entry.decade === 'Unknown' ? 0.6 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

function StatsTab({ stats }: { stats: AlumniStats }) {
  const cards = [
    { label: 'Total Alumni', value: stats.total.toLocaleString(), sub: 'in the database' },
    { label: 'Total Donors', value: stats.totalDonors.toLocaleString(), sub: 'donated in 2023 or 2024' },
    { label: '2023 Donations', value: `$${stats.totalDonated2023.toLocaleString()}`, sub: 'total raised' },
    { label: '2024 Donations', value: `$${stats.totalDonated2024.toLocaleString()}`, sub: 'total raised' },
    { label: 'Open to Network', value: `${stats.pctNetworking.toFixed(0)}%`, sub: 'of alumni' },
    { label: 'LinkedIn Added', value: '—', sub: 'coming soon via enrichment' },
  ];

  return (
    <div>
      <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 1.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Alumni Network Stats
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {cards.map(({ label, value, sub }) => (
          <div key={label} style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{label}</p>
            <p style={{ color: GOLD, fontWeight: 900, fontSize: '1.75rem', margin: '0 0 2px', lineHeight: 1 }}>{value}</p>
            <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AlumniClient({ alumni, stats }: { alumni: SafeAlumni[]; stats: AlumniStats }) {
  const [tab, setTab] = useState<TabId>('directory');
  const [filter, setFilter] = useState<FilterChip>('All');
  const [search, setSearch] = useState('');
  const [linkedInModal, setLinkedInModal] = useState<SafeAlumni | null>(null);
  const [linkedInUrls, setLinkedInUrls] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let list = alumni;

    if (filter === 'Parents') list = list.filter((a) => a.is_parent);
    else if (filter === 'Alumni') list = list.filter((a) => !a.is_parent);
    else if (filter !== 'All') list = list.filter((a) => a.grad_decade === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => fullName(a).toLowerCase().includes(q));
    }

    return list;
  }, [alumni, filter, search]);

  // Merge local linkedin_url overrides (after user saves one)
  const enriched = useMemo(() =>
    filtered.map((a) => linkedInUrls[a.id] !== undefined ? { ...a, linkedin_url: linkedInUrls[a.id] } : a),
    [filtered, linkedInUrls]
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: 'directory', label: `Directory (${alumni.length})` },
    { id: 'decade', label: 'Decade Map' },
    { id: 'stats', label: 'Stats' },
  ];

  return (
    <>
      {linkedInModal && (
        <LinkedInModal
          alumni={linkedInModal}
          onClose={() => setLinkedInModal(null)}
          onSaved={(id, url) => setLinkedInUrls((prev) => ({ ...prev, [id]: url }))}
        />
      )}

      {/* Tabs */}
      <div style={{ background: NAVY, borderBottom: '1px solid #1e3a5f', padding: '0 1.5rem', display: 'flex', gap: 0 }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: '1rem 1.25rem', background: 'none', border: 'none',
              borderBottom: tab === id ? `3px solid ${GOLD}` : '3px solid transparent',
              color: tab === id ? '#f8fafc' : 'rgba(255,255,255,0.5)',
              fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em',
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {tab === 'directory' && (
          <>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1rem', maxWidth: 360 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: 14 }}>🔍</span>
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px 10px 36px', color: '#f8fafc', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Filter chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {FILTER_CHIPS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 14px', borderRadius: 20,
                    border: `1px solid ${filter === f ? GOLD : '#1e3a5f'}`,
                    background: filter === f ? GOLD : 'transparent',
                    color: filter === f ? NAVY : '#94a3b8',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}
                >
                  {f}
                </button>
              ))}
              <span style={{ fontSize: 12, color: '#475569', alignSelf: 'center', marginLeft: 4 }}>
                {enriched.length} shown
              </span>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
              {enriched.map((a) => (
                <AlumniCard key={a.id} alumni={a} onAddLinkedIn={setLinkedInModal} />
              ))}
            </div>

            {enriched.length === 0 && (
              <p style={{ color: '#475569', textAlign: 'center', padding: '3rem 0' }}>No alumni match your search.</p>
            )}
          </>
        )}

        {tab === 'decade' && <DecadeMapTab decadeCounts={stats.decadeCounts} />}
        {tab === 'stats' && <StatsTab stats={stats} />}
      </div>
    </>
  );
}
