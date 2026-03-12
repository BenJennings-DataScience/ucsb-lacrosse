import { NextResponse } from 'next/server';
import { fetchRoster } from '@/lib/scraper';
import { deriveHometownCoords } from '@/lib/hometownCoords';

export interface RosterApiPlayer {
  slug: string;
  name: string;
  jersey: string;
  position: string;
  hometown: string;
  hometownCity: string;
  hometownState: string;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
}

export async function GET() {
  const players = await fetchRoster();
  const result: RosterApiPlayer[] = players.map((p) => {
    const coords = deriveHometownCoords(p.hometown);
    return {
      slug: p.slug,
      name: p.name,
      jersey: p.jersey,
      position: p.position,
      hometown: p.hometown,
      hometownCity: p.hometownCity,
      hometownState: p.hometownState,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      photoUrl: p.photoUrl,
    };
  });
  return NextResponse.json(result);
}
