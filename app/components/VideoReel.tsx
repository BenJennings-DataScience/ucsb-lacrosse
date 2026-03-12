'use client';

import { useEffect, useState } from 'react';
import type { VideoItem } from '@/app/api/videos/route';

const GOLD = '#FEBC11';
const NAVY = '#003660';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function VideoCard({ video }: { video: VideoItem }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flex: '0 0 260px',
        width: 260,
        background: '#0a1628',
        border: '1px solid #1e3a5f',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = GOLD)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e3a5f')}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#060f1c' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Play overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(254,188,17,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill={NAVY}>
              <polygon points="3,1 13,7 3,13" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', flexGrow: 1 }}>
        <p
          style={{
            color: '#f8fafc',
            fontWeight: 700,
            fontSize: '0.82rem',
            lineHeight: 1.35,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </p>
        <p style={{ color: '#475569', fontSize: '0.7rem', margin: 0 }}>{video.channel}</p>
        {video.publishedAt && (
          <p style={{ color: '#334155', fontSize: '0.68rem', margin: 0 }}>{formatDate(video.publishedAt)}</p>
        )}
      </div>
    </a>
  );
}

function FallbackCard() {
  return (
    <a
      href="https://www.youtube.com/results?search_query=UCSB+lacrosse"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flex: '0 0 260px',
        width: 260,
        background: '#0a1628',
        border: `1px solid ${GOLD}`,
        borderRadius: 12,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: '2rem' }}>📺</span>
      <p style={{ color: GOLD, fontWeight: 800, fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>
        Watch on YouTube →
      </p>
      <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0, textAlign: 'center' }}>
        Search UCSB lacrosse videos
      </p>
    </a>
  );
}

export default function VideoReel() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    fetch('/api/videos')
      .then((r) => r.json())
      .then((data) => {
        if (data.noKey) {
          setNoKey(true);
        } else if (Array.isArray(data.items)) {
          setVideos(data.items);
        }
      })
      .catch(() => {});
  }, []);

  const showFallback = noKey || videos.length === 0;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', width: 'max-content', padding: '0.25rem 0' }}>
        {showFallback ? (
          <FallbackCard />
        ) : (
          videos.map((v) => <VideoCard key={v.videoId} video={v} />)
        )}
      </div>
    </div>
  );
}
