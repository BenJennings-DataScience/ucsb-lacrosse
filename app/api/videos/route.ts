import { NextResponse } from 'next/server';

export interface VideoItem {
  videoId: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumbnail: string;
}

const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
let cache: { data: VideoItem[]; ts: number } | null = null;

const CHANNEL_HANDLES = ['ucsblacrosse4681', 'Gauchoslacrosse', 'dnf_adv_sports'];

async function getUploadsPlaylistId(handle: string, apiKey: string): Promise<{ channelTitle: string; playlistId: string } | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'id,contentDetails,snippet');
  url.searchParams.set('forHandle', handle);
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const json = await res.json();
  const item = json.items?.[0];
  if (!item) return null;
  return {
    channelTitle: item.snippet?.title ?? handle,
    playlistId: item.contentDetails?.relatedPlaylists?.uploads ?? '',
  };
}

async function getPlaylistVideos(
  playlistId: string,
  channelTitle: string,
  apiKey: string,
  maxResults = 20,
): Promise<VideoItem[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('playlistId', playlistId);
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = await res.json();

  return (json.items ?? [])
    .map((item: {
      snippet: {
        resourceId: { videoId: string };
        title: string;
        publishedAt: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      channel: channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
    }))
    .filter((v: VideoItem) => {
      if (!v.videoId || !v.title) return false;
      if (v.title === 'Private video' || v.title === 'Deleted video') return false;
      return /ucsb|uc santa barbara|gauchos/i.test(v.title);
    });
}

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ noKey: true, items: [] });
  }

  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ noKey: false, items: cache.data });
  }

  try {
    // Resolve all channel upload playlist IDs in parallel
    const channels = await Promise.all(
      CHANNEL_HANDLES.map((h) => getUploadsPlaylistId(h, apiKey))
    );

    // Fetch uploads from each channel in parallel
    const batches = await Promise.all(
      channels
        .filter((c): c is { channelTitle: string; playlistId: string } => !!c?.playlistId)
        .map((c) => getPlaylistVideos(c.playlistId, c.channelTitle, apiKey, 20))
    );

    // Deduplicate by videoId
    const seen = new Set<string>();
    const merged: VideoItem[] = [];
    for (const batch of batches) {
      for (const item of batch) {
        if (!seen.has(item.videoId)) {
          seen.add(item.videoId);
          merged.push(item);
        }
      }
    }

    // Sort by date descending, cap at 25
    const items = merged
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 25);

    cache = { data: items, ts: Date.now() };
    return NextResponse.json({ noKey: false, items });
  } catch {
    return NextResponse.json({ noKey: false, items: [] });
  }
}
