'use client';

import dynamicImport from 'next/dynamic';
import type { HometownPin } from './page';

const HometownsMapClient = dynamicImport(() => import('./HometownsMapClient'), {
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

export default function HometownsMapWrapper({ pins }: { pins: HometownPin[] }) {
  return <HometownsMapClient pins={pins} />;
}
