import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Gaucho Lax 2026 — UCSB Men\'s Lacrosse Stats & Schedule';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NAVY = '#003660';
const GOLD = '#FEBC11';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: NAVY,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative rings — offset left so they frame the content */}
      <div
        style={{
          position: 'absolute',
          width: 560,
          height: 560,
          borderRadius: 280,
          border: '1.5px solid rgba(254,188,17,0.18)',
          top: 35,
          right: -100,
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 780,
          height: 780,
          borderRadius: 390,
          border: '1px solid rgba(254,188,17,0.08)',
          top: -75,
          right: -220,
          display: 'flex',
        }}
      />

      {/* Left gold accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 8,
          height: '100%',
          background: GOLD,
          display: 'flex',
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        {/* Logo + wordmark row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 36,
          }}
        >
          {/* Gold circle with G */}
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              background: GOLD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 28,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: NAVY,
                fontSize: 62,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              G
            </span>
          </div>

          {/* UC SANTA BARBARA */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              UC SANTA BARBARA
            </span>
            <span
              style={{
                color: GOLD,
                fontSize: 78,
                fontWeight: 900,
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              GAUCHO LAX
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 720,
            height: 2,
            background: 'rgba(254,188,17,0.25)',
            marginBottom: 32,
            display: 'flex',
          }}
        />

        {/* Year badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: 'rgba(254,188,17,0.12)',
              border: '1px solid rgba(254,188,17,0.35)',
              borderRadius: 6,
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 18,
              paddingRight: 18,
              display: 'flex',
            }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.3em',
              }}
            >
              2026 MCLA SEASON
            </span>
          </div>
        </div>

        {/* Tagline */}
        <span
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '0.06em',
          }}
        >
          Stats · Schedule · Leaders · Travel Map
        </span>
      </div>
    </div>,
    { ...size },
  );
}
