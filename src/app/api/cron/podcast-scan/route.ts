import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import Parser from 'rss-parser';

export const maxDuration = 300;

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynww8bw3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'DeZestien.nl Podcast Scanner/1.0' },
  customFields: {
    item: [
      ['itunes:image', 'itunesImage'],
    ],
  },
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96);
}

function blockKey() {
  return Math.random().toString(36).slice(2, 10);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractYouTubeUrl(content: string): string | undefined {
  const match = content.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/watch?v=${match[1]}` : undefined;
}

// YouTube channel RSS video cache per channel
const ytVideoCache = new Map<string, { title: string; url: string }[]>();

async function fetchYouTubeVideos(channelId: string): Promise<{ title: string; url: string }[]> {
  if (ytVideoCache.has(channelId)) return ytVideoCache.get(channelId)!;

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { headers: { 'User-Agent': 'DeZestien.nl/1.0' } }
    );
    if (!res.ok) return [];

    const xml = await res.text();
    const videos: { title: string; url: string }[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = entryRegex.exec(xml)) !== null) {
      const titleMatch = m[1].match(/<title>([\s\S]*?)<\/title>/);
      const idMatch = m[1].match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
      if (titleMatch && idMatch) {
        videos.push({
          title: titleMatch[1].trim(),
          url: `https://youtu.be/${idMatch[1].trim()}`,
        });
      }
    }

    ytVideoCache.set(channelId, videos);
    return videos;
  } catch {
    return [];
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function matchYouTubeVideo(
  episodeTitle: string,
  videos: { title: string; url: string }[]
): string | undefined {
  const a = normalizeTitle(episodeTitle);

  for (const v of videos) {
    const b = normalizeTitle(v.title);

    // Exact or substring match
    if (a === b || a.includes(b) || b.includes(a)) return v.url;

    // Episode number match (e.g. #594)
    const numA = episodeTitle.match(/#(\d+)/);
    const numB = v.title.match(/#(\d+)/);
    if (numA && numB && numA[1] === numB[1]) return v.url;

    // Word overlap (60%+)
    const wordsA = a.split(' ').filter(w => w.length > 2);
    const wordsB = b.split(' ').filter(w => w.length > 2);
    if (wordsA.length > 0 && wordsB.length > 0) {
      const common = wordsA.filter(w => wordsB.includes(w));
      if (common.length / Math.min(wordsA.length, wordsB.length) >= 0.6) return v.url;
    }
  }

  return undefined;
}

function getEpisodeImageUrl(item: any): string | undefined {
  // 1. itunes:image (parsed by rss-parser custom field)
  if (item.itunesImage) {
    const href = typeof item.itunesImage === 'string'
      ? item.itunesImage
      : item.itunesImage?.$?.href || item.itunesImage?.href;
    if (href) return href;
  }
  // 2. itunes object (rss-parser built-in)
  if (item.itunes?.image) return item.itunes.image;
  // 3. enclosure with image MIME type
  if (item.enclosure?.type?.startsWith('image/') && item.enclosure.url) {
    return item.enclosure.url;
  }
  return undefined;
}

async function uploadImageToSanity(imageUrl: string): Promise<{ _type: string; asset: { _type: string; _ref: string } } | undefined> {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'DeZestien.nl/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return undefined;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return undefined;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return undefined; // Te klein, waarschijnlijk geen echte afbeelding

    const asset = await sanityClient.assets.upload('image', buffer, {
      filename: `podcast-episode-${Date.now()}.jpg`,
      contentType,
    });

    return {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
    };
  } catch {
    return undefined;
  }
}

function textToBlocks(text: string) {
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.map((line) => ({
    _type: 'block',
    _key: blockKey(),
    style: 'normal',
    children: [{ _type: 'span', _key: blockKey(), text: line.trim(), marks: [] }],
    markDefs: [],
  }));
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Haal alle actieve podcast shows op
    const shows = await sanityClient.fetch<any[]>(
      `*[_type == "podcastShow" && active == true]{
        _id, name, "slug": slug.current, feedUrl,
        spotifyShowUrl, applePodcastUrl, youtubeChannelUrl, youtubeChannelId
      }`
    );

    if (shows.length === 0) {
      return NextResponse.json({ scanned: 0, newEpisodes: 0, reason: 'Geen actieve podcast shows' });
    }

    // 2. Haal bestaande episode GUIDs op voor deduplicatie
    const existingGuids = await sanityClient.fetch<string[]>(
      `*[_type == "post" && category == "Podcast" && defined(podcastEpisodeGuid)].podcastEpisodeGuid`
    );
    const guidSet = new Set(existingGuids);

    const results: any[] = [];
    let totalNew = 0;

    // 3. Scan elke show
    for (const show of shows) {
      const showResult: any = { show: show.name, episodes: [] };

      try {
        const feed = await parser.parseURL(show.feedUrl);
        const items = feed.items.slice(0, 5); // Laatste 5 afleveringen

        for (const item of items) {
          const guid = item.guid || item.link || '';
          if (!guid || guidSet.has(guid)) continue;

          // Beschrijving opschonen
          const rawDesc = item.contentSnippet || item.content || item.summary || '';
          const cleanDesc = stripHtml(rawDesc);
          const excerpt = cleanDesc.slice(0, 300);

          // Embed URLs afleiden
          const content = `${item.content || ''} ${item.contentSnippet || ''}`;
          const youtubeUrl = extractYouTubeUrl(content);

          // Slug genereren
          const title = item.title || `${show.name} aflevering`;
          const slug = slugify(title);

          // Body blocks van beschrijving
          const bodyText = cleanDesc.slice(0, 1000) || `Nieuwe aflevering van ${show.name}.`;
          const bodyBlocks = textToBlocks(bodyText);

          // Sanity document aanmaken
          const doc: any = {
            _type: 'post',
            title,
            slug: { _type: 'slug', current: slug },
            category: 'Podcast',
            author: show.name,
            excerpt,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            podcastShow: { _type: 'reference', _ref: show._id },
            podcastEpisodeGuid: guid,
            podcastExternalLink: item.link || undefined,
            body: bodyBlocks,
            isHot: false,
          };

          // Episode afbeelding uit RSS halen en uploaden naar Sanity
          const episodeImageUrl = getEpisodeImageUrl(item);
          if (episodeImageUrl) {
            const mainImage = await uploadImageToSanity(episodeImageUrl);
            if (mainImage) doc.mainImage = mainImage;
          }

          // Embeds toevoegen indien beschikbaar
          if (youtubeUrl) {
            doc.youtubeEmbed = youtubeUrl;
          } else if (show.youtubeChannelId) {
            // Automatisch matchen met YouTube channel
            const ytVideos = await fetchYouTubeVideos(show.youtubeChannelId);
            const matchedUrl = matchYouTubeVideo(title, ytVideos);
            if (matchedUrl) doc.youtubeEmbed = matchedUrl;
          }

          try {
            await sanityClient.create(doc);
            guidSet.add(guid); // Voorkom dubbelen binnen dezelfde run
            showResult.episodes.push({ title, status: 'ok', youtubeMatched: !!doc.youtubeEmbed });
            totalNew++;
          } catch (createErr: any) {
            showResult.episodes.push({ title, status: 'error', error: createErr.message });
          }

          // Korte delay tussen writes
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (feedErr: any) {
        showResult.error = feedErr.message;
      }

      results.push(showResult);
    }

    // 4. Backfill: match YouTube voor bestaande episodes zonder embed
    let backfilled = 0;
    const showsWithYT = shows.filter((s: any) => s.youtubeChannelId);
    for (const show of showsWithYT) {
      const unmatched = await sanityClient.fetch<any[]>(
        `*[_type == "post" && category == "Podcast" && podcastShow._ref == $showId && !defined(youtubeEmbed)] { _id, title }`,
        { showId: show._id }
      );
      if (unmatched.length === 0) continue;

      const ytVideos = await fetchYouTubeVideos(show.youtubeChannelId);
      for (const ep of unmatched) {
        const matchedUrl = matchYouTubeVideo(ep.title, ytVideos);
        if (matchedUrl) {
          await sanityClient.patch(ep._id).set({ youtubeEmbed: matchedUrl }).commit();
          backfilled++;
        }
      }
    }

    return NextResponse.json({
      scanned: shows.length,
      newEpisodes: totalNew,
      backfilledYouTube: backfilled,
      shows: results,
    });
  } catch (error: any) {
    console.error('Podcast scan error:', error);
    return NextResponse.json({ error: error.message || 'Podcast scan failed' }, { status: 500 });
  }
}
