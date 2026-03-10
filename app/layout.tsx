import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Nav from './components/Nav';
import ServiceWorker from './components/ServiceWorker';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#003660',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

export const metadata: Metadata = {
  title: 'Gaucho Lax',
  description: '2026 UCSB Men\'s Lacrosse stats, schedule, and travel map',
  manifest: '/manifest.json',
  applicationName: 'Gaucho Lax',
  appleWebApp: {
    capable: true,
    title: 'Gaucho Lax',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Splash / tile colors for Windows & older iOS */}
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
