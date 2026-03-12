import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export interface NewsArticle {
  headline: string;
  date: string;
  url: string;
  thumbnail: null;
  isUCSB: boolean;
}

const FETCH_OPTS = {
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UCSB-Dashboard/1.0)' },
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
let cache: { data: NewsArticle[]; ts: number } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch('https://mcla.us/articles?fyr=2026', FETCH_OPTS);
    if (!res.ok) return NextResponse.json([]);
    const html = await res.text();
    const $ = cheerio.load(html);

    const articles: NewsArticle[] = [];

    $('h3').each((_, el) => {
      const a = $(el).find('a');
      const headline = a.text().trim();
      const href = a.attr('href');
      if (!headline || !href) return;

      const url = href.startsWith('http') ? href : `https://mcla.us${href}`;

      // Date is a text node immediately before the h3
      const prevText = $(el).prev('*').text().trim();
      const parentTextNodes = $(el).parent().contents().filter(function () {
        return this.type === 'text';
      });
      const date = prevText || parentTextNodes.first().text().trim();

      const lower = headline.toLowerCase();
      const isUCSB =
        lower.includes('santa barbara') ||
        lower.includes('ucsb') ||
        lower.includes('gaucho');

      articles.push({ headline, date, url, thumbnail: null, isUCSB });
    });

    // UCSB articles first, then rest
    const sorted = [
      ...articles.filter((a) => a.isUCSB),
      ...articles.filter((a) => !a.isUCSB),
    ];

    cache = { data: sorted, ts: Date.now() };
    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json([]);
  }
}
