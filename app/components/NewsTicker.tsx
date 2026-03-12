'use client';

import { useEffect, useState } from 'react';
import type { NewsArticle } from '@/app/api/news/route';

const GOLD = '#FEBC11';

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <div
      style={{
        flex: '0 0 320px',
        width: 320,
        background: '#0a1628',
        border: '1px solid #1e3a5f',
        borderLeft: article.isUCSB ? `3px solid ${GOLD}` : '1px solid #1e3a5f',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <p
        style={{
          color: GOLD,
          fontWeight: 800,
          fontSize: '0.9rem',
          lineHeight: 1.3,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {article.headline}
      </p>
      {article.date && (
        <p style={{ color: '#475569', fontSize: '0.7rem', margin: 0, fontWeight: 600 }}>
          {article.date}
        </p>
      )}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: GOLD,
          fontSize: '0.75rem',
          fontWeight: 700,
          textDecoration: 'none',
          marginTop: 'auto',
        }}
      >
        Read More →
      </a>
    </div>
  );
}

export default function NewsTicker() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/news')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
      })
      .catch(() => {});
  }, []);

  if (articles.length === 0) {
    return (
      <div style={{ padding: '0.75rem 1rem', color: '#475569', fontSize: '0.85rem' }}>
        No recent Gaucho news
      </div>
    );
  }

  // Duplicate cards so the loop appears seamless
  const doubled = [...articles, ...articles];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-track.paused {
          animation-play-state: paused;
        }
        @media (max-width: 640px) {
          .ticker-outer { overflow-y: auto !important; overflow-x: hidden !important; }
          .ticker-track { animation: none !important; flex-wrap: wrap !important; width: auto !important; }
        }
      `}</style>

      <div
        className="ticker-outer"
        style={{ overflow: 'hidden', position: 'relative' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 40,
            background: 'linear-gradient(to right, #060f1c, transparent)',
            zIndex: 2, pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 40,
            background: 'linear-gradient(to left, #060f1c, transparent)',
            zIndex: 2, pointerEvents: 'none',
          }}
        />

        <div
          className={`ticker-track${paused ? ' paused' : ''}`}
          style={{ display: 'flex', gap: '1rem', width: 'max-content', padding: '0.25rem 0 0.5rem' }}
        >
          {doubled.map((article, i) => (
            <ArticleCard key={i} article={article} />
          ))}
        </div>
      </div>
    </>
  );
}
