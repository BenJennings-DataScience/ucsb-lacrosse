'use client';

import dynamicImport from 'next/dynamic';
import type { MapGame } from './page';

const TravelMapClient = dynamicImport(() => import('./TravelMapClient'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center"
      style={{
        height: 'calc(100vh - 200px)',
        minHeight: 480,
        backgroundColor: '#111827',
        borderTop: '1px solid #1e3a5f',
      }}
    >
      <span style={{ color: '#94a3b8' }}>Loading map…</span>
    </div>
  ),
});

export default function MapWrapper({ games }: { games: MapGame[] }) {
  return <TravelMapClient games={games} />;
}
