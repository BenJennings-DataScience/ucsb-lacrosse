'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/stats', label: 'Stats' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav style={{ backgroundColor: '#003660' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
            style={{ backgroundColor: '#FEBC11', color: '#003660' }}
          >
            UC
          </div>
          <span className="font-bold text-white text-lg tracking-wide">
            UCSB <span style={{ color: '#FEBC11' }}>LACROSSE</span>
          </span>
        </Link>
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
      </div>
    </nav>
  );
}
