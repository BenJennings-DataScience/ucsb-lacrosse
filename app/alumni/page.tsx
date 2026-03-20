export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import AlumniClient from './AlumniClient';
import type { SafeAlumni, AlumniStats } from './AlumniClient';

// Fields returned to client — email and phone are intentionally excluded
const SAFE_FIELDS = 'id,first_name,last_name,company,job_title,industry,grad_decade,bio,linkedin_url,open_to_networking,is_parent,tags';

export default async function AlumniPage() {
  // Fetch safe alumni fields
  const { data: alumniRaw } = await supabase
    .from('alumni')
    .select(SAFE_FIELDS)
    .order('last_name', { ascending: true });

  const alumni: SafeAlumni[] = alumniRaw ?? [];

  // Fetch stats aggregates — done server-side so donation figures never hit the browser
  const { data: statsRaw } = await supabase
    .from('alumni')
    .select('grad_decade,is_parent,open_to_networking,donation_2023,donation_2024');

  const rows = statsRaw ?? [];
  const totalDonors = rows.filter(
    (r) => (Number(r.donation_2023) > 0) || (Number(r.donation_2024) > 0)
  ).length;
  const totalDonated2023 = rows.reduce((s, r) => s + (Number(r.donation_2023) || 0), 0);
  const totalDonated2024 = rows.reduce((s, r) => s + (Number(r.donation_2024) || 0), 0);
  const pctNetworking = rows.length ? (rows.filter((r) => r.open_to_networking).length / rows.length) * 100 : 0;

  // Decade distribution
  const decadeMap: Record<string, number> = {};
  for (const r of rows) {
    const d = r.grad_decade ?? 'Unknown';
    decadeMap[d] = (decadeMap[d] ?? 0) + 1;
  }
  const decadeOrder = ['1980s', '1990s', '2000s', '2010s', '2020s', 'Unknown'];
  const decadeCounts = decadeOrder
    .filter((d) => decadeMap[d])
    .map((d) => ({ decade: d, count: decadeMap[d] }));

  const stats: AlumniStats = {
    total: alumni.length,
    totalDonors,
    totalDonated2023: Math.round(totalDonated2023),
    totalDonated2024: Math.round(totalDonated2024),
    pctNetworking,
    decadeCounts,
  };

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001f3f 0%, #003660 60%, #001a30 100%)',
          padding: '2.5rem 1.5rem 2rem',
          borderBottom: '1px solid #1e3a5f',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: '#FEBC11', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
          UCSB Men&apos;s Lacrosse
        </p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#f8fafc', margin: '0 0 8px', lineHeight: 1.1 }}>
          Alumni Network
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          {alumni.length} alumni · {totalDonors} donors · Gaucho Lax community
        </p>
      </div>

      <AlumniClient alumni={alumni} stats={stats} />
    </div>
  );
}
