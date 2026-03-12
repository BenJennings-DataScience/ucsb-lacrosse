'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import SearchBar from './SearchBar';

const NAVY = '#003660';
const GOLD = '#FEBC11';

type DropdownItem = { href: string; label: string };
type NavItem =
  | { kind: 'link'; href: string; label: string }
  | { kind: 'dropdown'; label: string; items: DropdownItem[] };

const NAV_ITEMS: NavItem[] = [
  { kind: 'link', href: '/', label: 'Home' },
  { kind: 'link', href: '/schedule', label: 'Schedule' },
  {
    kind: 'dropdown',
    label: 'Insights',
    items: [
      { href: '/stats', label: 'Stats' },
      { href: '/leaders', label: 'Leaders' },
      { href: '/polls', label: 'Polls' },
    ],
  },
  {
    kind: 'dropdown',
    label: 'Maps',
    items: [
      { href: '/map', label: 'Game Map' },
      { href: '/hometowns', label: 'Player Hometowns' },
    ],
  },
  {
    kind: 'dropdown',
    label: 'Give',
    items: [
      { href: '/keg', label: 'Fund a Keg 🍺' },
      { href: '/donate', label: 'Donate' },
    ],
  },
];

function DropdownMenu({
  label,
  items,
  activePaths,
}: {
  label: string;
  items: DropdownItem[];
  activePaths: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = activePaths.some((p) => items.some((i) => i.href !== '/' && p.startsWith(i.href)));

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); }
        }}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 px-3 py-2 rounded text-sm font-semibold transition-colors"
        style={{
          backgroundColor: isActive ? GOLD : 'transparent',
          color: isActive ? NAVY : 'rgba(255,255,255,0.85)',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
        }}
      >
        {label}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          style={{
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.7,
          }}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            backgroundColor: '#0a1f3a',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {items.map(({ href, label: itemLabel }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm font-semibold transition-colors"
              style={{ color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e3a5f')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {itemLabel}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav style={{ backgroundColor: NAVY }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/gaucho-logo.png"
            alt="Gaucho Lax"
            width={40}
            height={40}
            className="rounded-full"
            style={{ objectFit: 'cover' }}
          />
          <span className="font-bold text-white text-lg tracking-wide">
            UCSB <span style={{ color: GOLD }}>LACROSSE</span>
          </span>
        </Link>

        {/* Nav items + search */}
        <div className="flex items-center gap-1 min-w-0">
          {NAV_ITEMS.map((item) => {
            if (item.kind === 'link') {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? GOLD : 'transparent',
                    color: active ? NAVY : 'rgba(255,255,255,0.85)',
                  }}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <DropdownMenu
                key={item.label}
                label={item.label}
                items={item.items}
                activePaths={[pathname]}
              />
            );
          })}

          <div className="hidden sm:block min-w-[180px] ml-2">
            <SearchBar />
          </div>
        </div>
      </div>
    </nav>
  );
}
