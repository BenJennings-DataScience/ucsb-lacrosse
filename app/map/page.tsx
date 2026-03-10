export const dynamic = 'force-dynamic';

import { fetchSchedule } from '@/lib/scraper';
import type { Game } from '@/lib/scraper';
import { UCSB_COORDS, getCoords, haversine } from './coords';
import MapWrapper from './MapWrapper';

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

export default async function MapPage() {
  let mapGames: MapGame[] = [];
  try {
    const data = await fetchSchedule();
    mapGames = buildMapGames(data.games);
  } catch {
    // handled below
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
      <MapWrapper games={mapGames} />
    </div>
  );
}
