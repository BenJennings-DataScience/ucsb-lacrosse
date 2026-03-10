import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Nav from './components/Nav';
import ServiceWorker from './components/ServiceWorker';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gaucho-lax.vercel.app';

export const viewport: Viewport = {
  themeColor: '#003660',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Gaucho Lax 2026',
    template: '%s · Gaucho Lax',
  },
  description: 'UCSB Men\'s Lacrosse — 2026 Season Stats, Schedule & Travel Map',
  applicationName: 'Gaucho Lax',
  manifest: '/manifest.json',

  // ── Open Graph ──────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    siteName: 'Gaucho Lax',
    title: 'Gaucho Lax 2026',
    description: 'UCSB Men\'s Lacrosse Stats & Schedule',
    url: SITE_URL,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Gaucho Lax 2026 — UCSB Men\'s Lacrosse',
      },
    ],
  },

  // ── Twitter / X ─────────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Gaucho Lax 2026',
    description: 'UCSB Men\'s Lacrosse Stats & Schedule',
    images: ['/opengraph-image'],
  },

  // ── Icons ────────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/icon', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },

  // ── Apple PWA ────────────────────────────────────────────────────────────────
  appleWebApp: {
    capable: true,
    title: 'Gaucho Lax',
    statusBarStyle: 'black-translucent',
  },

  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="msapplication-TileColor" content="#003660" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
      </head>
      <body className={geistSans.variable}>
        <ServiceWorker />
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
