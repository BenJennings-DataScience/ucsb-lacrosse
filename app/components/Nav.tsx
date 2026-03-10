'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';

const links = [
  { href: '/', label: 'Home' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/stats', label: 'Stats' },
  { href: '/leaders', label: 'Leaders' },
  { href: '/map', label: 'Map' },
  { href: '/polls', label: 'Polls' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav style={{ backgroundColor: '#003660' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/gaucho-logo.png"
            alt="Gaucho Lax"
            width={40}
            height={40}
            className="rounded-full"
            style={{ objectFit: 'cover' }}
          />
          <span className="font-bold text-white text-lg tracking-wide">
            UCSB <span style={{ color: '#FEBC11' }}>LACROSSE</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {links.map(({ href, label }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-2 rounded text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? '#FEBC11' : 'transparent',
                    color: active ? '#003660' : 'rgba(255,255,255,0.85)',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}
