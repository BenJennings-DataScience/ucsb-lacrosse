import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Nav from './components/Nav';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UCSB Men\'s Lacrosse',
  description: '2026 UCSB Men\'s Lacrosse stats and schedule dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geistSans.variable}>
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
