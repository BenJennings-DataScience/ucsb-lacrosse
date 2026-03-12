import { supabase } from '@/lib/supabase';
import DonateClient from './DonateClient';

async function getStats(): Promise<{ totalAmount: number; donorCount: number }> {
  try {
    // Admins only see donations — public read policy intentionally omitted.
    // We aggregate server-side using the anon key (fine since totals are public-facing).
    const { data } = await supabase.from('program_donations').select('amount');
    if (!data) return { totalAmount: 0, donorCount: 0 };
    return {
      totalAmount: data.reduce((sum, d) => sum + Number(d.amount), 0),
      donorCount: data.length,
    };
  } catch {
    return { totalAmount: 0, donorCount: 0 };
  }
}

export default async function DonatePage() {
  const stats = await getStats();
  return (
    <div className="-mx-4 -mt-8">
      <DonateClient stats={stats} />
    </div>
  );
}
