'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapGame } from './page';

const UCSB: [number, number] = [34.414, -119.8489];
const GOLD = '#FEBC11';
const RED = '#ef4444';
const GREY = '#6b7280';
const NAVY = '#003660';

// Fix leaflet's broken default icon paths under webpack
// We use DivIcons exclusively so this isn't strictly needed,
// but calling it prevents console errors.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function pinColor(result: 'W' | 'L' | null): string {
  if (result === 'W') return GOLD;
  if (result === 'L') return RED;
  return GREY;
}

function textColor(bg: string): string {
  return bg === GOLD ? NAVY : '#ffffff';
}

function makeIcon(num: number, color: string, isHome: boolean) {
  const bg = color;
  const fg = textColor(bg);
  const size = isHome ? 36 : 30;
  const border = isHome ? '3px solid white' : '2px solid rgba(255,255,255,0.7)';
  const shadow = '0 2px 8px rgba(0,0,0,0.7)';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};color:${fg};
      width:${size}px;height:${size}px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:900;font-size:${isHome ? 11 : 10}px;
      border:${border};box-shadow:${shadow};
      font-family:system-ui,sans-serif;
      pointer-events:none;
    ">${isHome ? '⌂' : num}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function homeIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${NAVY};color:${GOLD};
      width:38px;height:38px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:900;font-size:16px;
      border:3px solid ${GOLD};box-shadow:0 2px 8px rgba(0,0,0,0.7);
      font-family:system-ui,sans-serif;
      pointer-events:none;
    ">⌂</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -23],
  });
}

interface Props {
  games: MapGame[];
}

export default function TravelMapClient({ games }: Props) {
  // Route: start at UCSB, then each game location in order
  const routePoints: [number, number][] = [
    UCSB,
    ...games.map((g) => [g.lat, g.lng] as [number, number]),
  ];

  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([UCSB]);

  useEffect(() => {
    // Small delay before animation starts
    const startDelay = setTimeout(() => {
      let i = 1;
      const interval = setInterval(() => {
        setDrawnPoints(routePoints.slice(0, i + 1));
        i++;
        if (i >= routePoints.length) clearInterval(interval);
      }, 320);
      return () => clearInterval(interval);
    }, 600);
    return () => clearTimeout(startDelay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games.length]);

  // Stats
  const awayGames = games.filter((g) => g.isAway);
  const totalMiles = awayGames.reduce((s, g) => s + g.miles, 0);
  const furthest = awayGames.length
    ? awayGames.reduce((best, g) => (g.miles > best.miles ? g : best))
    : null;
  const homeGames = games.filter((g) => !g.isAway && g.result);
  const homeWins = homeGames.filter((g) => g.result === 'W').length;
  const homeLosses = homeGames.filter((g) => g.result === 'L').length;
  const awayPlayed = awayGames.filter((g) => g.result);
  const awayWins = awayPlayed.filter((g) => g.result === 'W').length;
  const awayLosses = awayPlayed.filter((g) => g.result === 'L').length;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Map */}
      <div style={{ height: 'calc(100vh - 200px)', minHeight: 480, position: 'relative' }}>
        <MapContainer
          center={[38.5, -112]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: '#0b1120' }}
          zoomControl
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Animated journey line */}
          {drawnPoints.length >= 2 && (
            <Polyline
              positions={drawnPoints}
              pathOptions={{
                color: GOLD,
                weight: 2.5,
                opacity: 0.7,
                dashArray: '8 5',
              }}
            />
          )}

          {/* UCSB home base marker */}
          <Marker position={UCSB} icon={homeIcon()}>
            <Popup>
              <div style={{ fontFamily: 'system-ui', minWidth: 160 }}>
                <div style={{ fontWeight: 900, color: NAVY, fontSize: 14 }}>🏠 UC Santa Barbara</div>
                <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>Home base · Santa Barbara, CA</div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -22]} opacity={0.95} permanent={false}>
              UCSB Home
            </Tooltip>
          </Marker>

          {/* Game markers */}
          {games.map((game) => {
            const color = pinColor(game.result);
            const isHomeGame = !game.isAway;
            const icon = makeIcon(game.gameNumber, color, isHomeGame);
            const pos: [number, number] = [game.lat, game.lng];

            return (
              <Marker key={game.gameNumber} position={pos} icon={icon}>
                <Popup>
                  <div style={{ fontFamily: 'system-ui', minWidth: 180 }}>
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 14,
                        color: NAVY,
                        borderBottom: `3px solid ${color}`,
                        paddingBottom: 4,
                        marginBottom: 6,
                      }}
                    >
                      Game {game.gameNumber} — {game.isAway ? 'Away' : 'Home'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{game.opponent}</div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>{game.date}</div>
                    {game.score ? (
                      <div style={{ fontSize: 13, fontWeight: 700, color: color === GOLD ? '#15803d' : color === RED ? '#b91c1c' : '#555' }}>
                        {game.result} · {game.score}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#888' }}>Not yet played</div>
                    )}
                    {game.miles > 0 && (
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                        {game.miles.toLocaleString()} mi from Santa Barbara
                      </div>
                    )}
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -18]} opacity={0.92}>
                  #{game.gameNumber} {game.opponent}
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Stats bar */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderTop: '2px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
        className="px-4 py-4"
      >
        <div className="flex flex-wrap gap-6 items-center justify-between">
          {/* Left: stat blocks */}
          <div className="flex flex-wrap gap-6">
            <StatBlock label="Total Miles Traveled" value={totalMiles > 0 ? `${totalMiles.toLocaleString()} mi` : '—'} />
            <StatBlock label="Furthest Game" value={furthest ? `${furthest.opponent} (${furthest.miles.toLocaleString()} mi)` : '—'} />
            <StatBlock
              label="Home Record"
              value={homeGames.length ? `${homeWins}–${homeLosses}` : '—'}
              color={homeWins > homeLosses ? '#86efac' : homeWins < homeLosses ? '#fca5a5' : undefined}
            />
            <StatBlock
              label="Away Record"
              value={awayPlayed.length ? `${awayWins}–${awayLosses}` : '—'}
              color={awayWins > awayLosses ? '#86efac' : awayWins < awayLosses ? '#fca5a5' : undefined}
            />
            <StatBlock label="Games" value={`${games.length} total`} />
          </div>

          {/* Right: legend */}
          <div className="flex items-center gap-4">
            <LegendDot color={GOLD} label="Win" />
            <LegendDot color={RED} label="Loss" />
            <LegendDot color={GREY} label="Upcoming" />
            <LegendDot color={NAVY} label="Home" border={GOLD} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </div>
      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: color ?? 'var(--text)', marginTop: 1 }}>
        {value}
      </div>
    </div>
  );
}

function LegendDot({ color, label, border }: { color: string; label: string; border?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: color,
          border: border ? `2px solid ${border}` : '2px solid rgba(255,255,255,0.3)',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{label}</span>
    </div>
  );
}
