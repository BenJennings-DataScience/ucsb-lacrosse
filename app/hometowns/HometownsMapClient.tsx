'use client';

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HometownPin } from './page';

const NAVY = '#003660';
const GOLD = '#FEBC11';
const MAP_HEIGHT = 'calc(100vh - 260px)';

// ── Icon makers ──────────────────────────────────────────────────────────────

function makeClusterIcon(count: number): L.DivIcon {
  const size = count >= 5 ? 46 : 38;
  const fontSize = count >= 10 ? 13 : 15;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${NAVY};
      border:2.5px solid ${GOLD};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font:700 ${fontSize}px/1 system-ui,sans-serif;
      color:${GOLD};
      box-shadow:0 2px 8px rgba(0,0,0,.55);
    ">${count}</div>`,
  });
}

function makePlayerIcon(photoUrl: string | null, initials: string): L.DivIcon {
  const size = 36;
  const inner = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<span style="font:700 12px/1 system-ui,sans-serif;color:${GOLD};">${initials}</span>`;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${NAVY};
      border:2px solid ${GOLD};
      border-radius:50%;
      overflow:hidden;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,.55);
    ">${inner}</div>`,
  });
}

function makeAlumniIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;
      background:#78350f;
      border:2px solid ${GOLD};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font:700 10px/1 system-ui,sans-serif;
      color:${GOLD};
      box-shadow:0 2px 6px rgba(0,0,0,.5);
    ">A</div>`,
  });
}

// ── Component ────────────────────────────────────────────────────────────────

type LayerMode = 'players' | 'alumni' | 'both';

export default function HometownsMapClient({ pins }: { pins: HometownPin[] }) {
  const [mode, setMode] = useState<LayerMode>('players');
  const [showConnections, setShowConnections] = useState(false);

  // Group pins by exact hometown string → one map marker per city
  const cityGroups = useMemo(() => {
    const map = new Map<string, HometownPin[]>();
    for (const pin of pins) {
      if (!map.has(pin.hometown)) map.set(pin.hometown, []);
      map.get(pin.hometown)!.push(pin);
    }
    return Array.from(map.entries()).map(([hometown, players]) => ({
      hometown,
      players,
      lat: players[0].lat,
      lng: players[0].lng,
    }));
  }, [pins]);

  // Sidebar stats
  const stats = useMemo(() => {
    const stateCount = new Map<string, number>();
    const cityCount = new Map<string, number>();
    for (const p of pins) {
      if (p.hometownState) stateCount.set(p.hometownState, (stateCount.get(p.hometownState) || 0) + 1);
      if (p.hometownCity) cityCount.set(p.hometownCity, (cityCount.get(p.hometownCity) || 0) + 1);
    }
    const topState = [...stateCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const topCity = [...cityCount.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      total: pins.length,
      uniqueStates: stateCount.size,
      topState: topState ? `${topState[0]} (${topState[1]})` : '—',
      topCity: topCity ? `${topCity[0]} (${topCity[1]})` : '—',
    };
  }, [pins]);

  // Connection lines: star pattern linking all players from same state
  const connectionLines = useMemo(() => {
    if (!showConnections) return [];
    const byState = new Map<string, HometownPin[]>();
    for (const p of pins) {
      if (!p.hometownState) continue;
      if (!byState.has(p.hometownState)) byState.set(p.hometownState, []);
      byState.get(p.hometownState)!.push(p);
    }
    const lines: [[number, number], [number, number]][] = [];
    for (const players of byState.values()) {
      if (players.length < 2) continue;
      const anchor = players[0];
      for (let i = 1; i < players.length; i++) {
        lines.push([[anchor.lat, anchor.lng], [players[i].lat, players[i].lng]]);
      }
    }
    return lines;
  }, [pins, showConnections]);

  const showPlayers = mode === 'players' || mode === 'both';

  return (
    <div>
      {/* Stats bar */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          padding: '0.65rem 1rem',
          backgroundColor: '#0a1628',
          borderTop: '1px solid #1e3a5f',
          borderBottom: '1px solid #1e3a5f',
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Players mapped', value: stats.total },
          { label: 'States', value: stats.uniqueStates },
          { label: 'Top state', value: stats.topState },
          { label: 'Top city', value: stats.topCity },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em', margin: 0 }}>
              {label}
            </p>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Map + overlaid controls */}
      <div style={{ position: 'relative' }}>
        <MapContainer
          center={[38, -97]}
          zoom={4}
          style={{ height: MAP_HEIGHT, minHeight: 480 }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Player city markers */}
          {showPlayers &&
            cityGroups.map(({ hometown, players, lat, lng }) => {
              const icon =
                players.length === 1
                  ? makePlayerIcon(
                      players[0].photoUrl,
                      players[0].name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )
                  : makeClusterIcon(players.length);

              return (
                <Marker key={hometown} position={[lat, lng]} icon={icon}>
                  <Popup>
                    <div style={{ minWidth: 160, maxWidth: 220 }}>
                      <p style={{ fontWeight: 700, marginBottom: 8, color: NAVY, fontSize: 13 }}>
                        {players[0].hometownCity || hometown}
                        {players[0].hometownState ? `, ${players[0].hometownState}` : ''}
                      </p>
                      {players.map((p) => (
                        <div
                          key={p.slug}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
                        >
                          {p.photoUrl && (
                            <img
                              src={p.photoUrl}
                              alt={p.name}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: `1.5px solid ${GOLD}`,
                              }}
                            />
                          )}
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
                              <a
                                href={`/players/${p.slug}`}
                                style={{ color: NAVY, textDecoration: 'none' }}
                              >
                                #{p.jersey} {p.name}
                              </a>
                            </p>
                            {p.position && (
                              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>{p.position}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Alumni placeholder — no data yet */}
          {(mode === 'alumni' || mode === 'both') && (
            <Marker
              position={[51.505, -0.09]}
              icon={makeAlumniIcon()}
              opacity={0}
            >
              <Popup>Alumni data coming soon</Popup>
            </Marker>
          )}

          {/* Connection lines */}
          {connectionLines.map((positions, i) => (
            <Polyline
              key={i}
              positions={positions}
              pathOptions={{ color: GOLD, opacity: 0.3, weight: 1.5, dashArray: '5 5' }}
            />
          ))}
        </MapContainer>

        {/* Layer / connection toggle */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'rgba(10,22,40,0.92)',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '0.5rem',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Layer
          </p>
          {(['players', 'alumni', 'both'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={m === 'alumni' || m === 'both'}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: m === 'players' ? 'pointer' : 'not-allowed',
                backgroundColor: mode === m ? GOLD : '#1e3a5f',
                color: mode === m ? NAVY : m === 'players' ? '#94a3b8' : '#4a5568',
                opacity: m === 'alumni' || m === 'both' ? 0.5 : 1,
                textTransform: 'capitalize',
              }}
              title={m !== 'players' ? 'Coming soon' : undefined}
            >
              {m}
            </button>
          ))}
          <div style={{ marginTop: 4, borderTop: '1px solid #1e3a5f', paddingTop: 4 }}>
            <button
              onClick={() => setShowConnections((v) => !v)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                backgroundColor: showConnections ? GOLD : '#1e3a5f',
                color: showConnections ? NAVY : '#94a3b8',
              }}
            >
              Connections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
