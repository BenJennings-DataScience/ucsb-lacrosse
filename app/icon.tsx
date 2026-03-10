import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        background: '#003660',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          color: '#FEBC11',
          fontSize: 20,
          fontWeight: 900,
          lineHeight: 1,
          marginTop: 1,
        }}
      >
        G
      </span>
    </div>,
    { ...size },
  );
}
