export const dynamic = 'force-dynamic';

import { fetchRoster, fetchStats } from '@/lib/scraper';
import { deriveHometownCoords } from '@/lib/hometownCoords';
import RosterClient from './RosterClient';
import type { RosterApiPlayer } from '@/app/api/roster/route';

const NAVY = '#003660';
const GOLD = '#FEBC11';

export default async function RosterPage() {
  let players: RosterApiPlayer[] = [];

  try {
    const [roster, stats] = await Promise.all([fetchRoster(), fetchStats()]);

    const statsMap = new Map<string, { gp: number; goals: number; assists: number; points: number; groundBalls: number }>();
    for (const p of stats.fieldPlayers) {
      statsMap.set(p.slug, {
        gp: parseInt(p.gp) || 0,
        goals: parseInt(p.goals) || 0,
        assists: parseInt(p.assists) || 0,
        points: parseInt(p.points) || 0,
        groundBalls: parseInt(p.groundBalls) || 0,
      });
    }
    for (const g of stats.goalies) {
      statsMap.set(g.slug, {
        gp: parseInt(g.gp) || 0,
        goals: parseInt(g.goals) || 0,
        assists: parseInt(g.assists) || 0,
        points: (parseInt(g.goals) || 0) + (parseInt(g.assists) || 0),
        groundBalls: 0,
      });
    }

    players = roster.map((p) => {
      const coords = deriveHometownCoords(p.hometown);
      const s = statsMap.get(p.slug);
      return {
        slug: p.slug,
        name: p.name,
        jersey: p.jersey,
        position: p.position,
        classYear: p.classYear,
        hometown: p.hometown,
        hometownCity: p.hometownCity,
        hometownState: p.hometownState,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        photoUrl: p.photoUrl,
        gp: s?.gp ?? 0,
        goals: s?.goals ?? 0,
        assists: s?.assists ?? 0,
        points: s?.points ?? 0,
        groundBalls: s?.groundBalls ?? 0,
      };
    });

    players.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (parseInt(a.jersey) || 99) - (parseInt(b.jersey) || 99);
    });
  } catch {
    // handled below via empty array
  }

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(135deg, #001f3f 0%, ${NAVY} 60%, #001a30 100%)`,
          padding: '2.5rem 1.5rem 2rem',
          borderBottom: '1px solid #1e3a5f',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
          2026 Season
        </p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#f8fafc', margin: '0 0 8px', lineHeight: 1.1 }}>
          UC Santa Barbara Gauchos
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          MCLA Men&apos;s Lacrosse · {players.length} Players on Roster
        </p>
      </div>

      {players.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>
          Failed to load roster. Check your network connection.
        </div>
      ) : (
        <RosterClient players={players} />
      )}
    </div>
  );
}
