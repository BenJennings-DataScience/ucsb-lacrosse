export const dynamic = 'force-dynamic';

import { fetchSchedule } from '@/lib/scraper';
import type { Game } from '@/lib/scraper';
import { UCSB_COORDS, getCoords, haversine } from './coords';
import MapWrapper from './MapWrapper';
import type { HometownPlayer } from '@/app/api/hometowns/route';

export interface MapGame {
  gameNumber: number;
  opponent: string;
  date: string;
  month: string;
  isAway: boolean;
  result: 'W' | 'L' | null;
  score: string | null;
  lat: number;
  lng: number;
  miles: number;
}

function buildMapGames(games: Game[]): MapGame[] {
  return games.map((g, i) => {
    const [lat, lng] = getCoords(g.opponent, g.isAway);
    const miles = Math.round(haversine(UCSB_COORDS[0], UCSB_COORDS[1], lat, lng));
    return {
      gameNumber: i + 1,
      opponent: g.opponent,
      date: `${g.month} ${g.date}`,
      month: g.month,
      isAway: g.isAway,
      result: (g.result as 'W' | 'L' | null),
      score: g.score,
      lat,
      lng,
      miles,
    };
  });
}

export interface MapHometown {
  id: string;
  name: string;
  hometown: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  position: string | null;
  jersey: string | null;
  slug: string | null;
}

export default async function MapPage() {
  let mapGames: MapGame[] = [];
  let hometowns: MapHometown[] = [];

  try {
    const data = await fetchSchedule();
    mapGames = buildMapGames(data.games);
  } catch {
    // handled below
  }

  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}`
      : 'http://localhost:3000';
    const res = await fetch(`${base}/api/hometowns`, { cache: 'no-store' });
    if (res.ok) {
      const raw: HometownPlayer[] = await res.json();
      hometowns = raw.map((p) => ({
        id: p.id,
        name: p.name,
        hometown: p.hometown ?? '',
        lat: p.hometown_lat,
        lng: p.hometown_lng,
        photoUrl: p.photo_url,
        position: p.position,
        jersey: p.number != null ? String(p.number) : null,
        slug: p.slug,
      }));
    }
  } catch {
    // hometowns layer simply won't appear until DB is populated
  }

  return (
    <div className="-mx-4 -mt-8">
      <div className="px-4 pt-6 pb-4">
        <p className="section-title">2026 Season</p>
        <h1 className="text-3xl font-black text-white">Travel Map</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '2px' }}>
          UCSB Gauchos journey through the MCLA season
        </p>
      </div>
      <MapWrapper games={mapGames} hometowns={hometowns} />
    </div>
  );
}
