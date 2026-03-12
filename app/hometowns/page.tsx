export const dynamic = 'force-dynamic';

import { fetchRoster } from '@/lib/scraper';
import { deriveHometownCoords } from '@/lib/hometownCoords';
import HometownsMapWrapper from './HometownsMapWrapper';

export interface HometownPin {
  slug: string;
  name: string;
  jersey: string;
  position: string;
  hometown: string;
  hometownCity: string;
  hometownState: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
}

export default async function HometownsPage() {
  let pins: HometownPin[] = [];

  try {
    const players = await fetchRoster();
    pins = players
      .map((p) => {
        const coords = deriveHometownCoords(p.hometown);
        if (!coords) return null;
        return {
          slug: p.slug,
          name: p.name,
          jersey: p.jersey,
          position: p.position,
          hometown: p.hometown,
          hometownCity: p.hometownCity,
          hometownState: p.hometownState,
          lat: coords.lat,
          lng: coords.lng,
          photoUrl: p.photoUrl,
        } satisfies HometownPin;
      })
      .filter((p): p is HometownPin => p !== null);
  } catch {
    // map renders empty if scrape fails
  }

  return (
    <div className="-mx-4 -mt-8">
      <div className="px-4 pt-6 pb-4">
        <p className="section-title">2026 Roster</p>
        <h1 className="text-3xl font-black text-white">Player Hometowns</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '2px' }}>
          Where the Gauchos come from
        </p>
      </div>
      <HometownsMapWrapper pins={pins} />
    </div>
  );
}
