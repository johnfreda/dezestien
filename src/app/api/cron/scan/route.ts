import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import Parser from 'rss-parser';

export const maxDuration = 300; // 5 minuten — nodig voor 8 feeds + artikel generatie

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vi366jej',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'DeZestien.nl RSS Reader/1.0',
  },
});

// Voetbal RSS feeds
const RSS_FEEDS = [
  { url: 'https://www.ign.com/rss/articles/feed', source: 'IGN', lang: 'en' },
  { url: 'https://www.gamespot.com/feeds/mashup/', source: 'GameSpot', lang: 'en' },
  { url: 'https://kotaku.com/rss', source: 'Kotaku', lang: 'en' },
  { url: 'https://www.eurovoetbalfan.net/feed', source: 'Eurovoetbalfan', lang: 'en' },
  { url: 'https://www.pcvoetbalfan.com/rss/', source: 'PC Voetbalfan', lang: 'en' },
  { url: 'https://www.theverge.com/games/rss/index.xml', source: 'The Verge', lang: 'en' },
  { url: 'https://tweakers.net/feeds/mixed.xml', source: 'Tweakers', lang: 'nl' },
  { url: 'https://www.voetbalfan.nl/feed/', source: 'Voetbalfan.nl', lang: 'nl' },
];

// Stopwords to ignore when comparing titles (EN + NL)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
  'not', 'no', 'so', 'if', 'than', 'too', 'very', 'just', 'about',
  'up', 'out', 'its', 'it', 'this', 'that', 'these', 'those', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'only', 'own', 'same', 'how', 'what', 'which', 'who',
  'when', 'where', 'why', 'new', 'now', 'get', 'got', 'gets',
  'de', 'het', 'een', 'van', 'en', 'in', 'op', 'voor', 'met',
  'naar', 'bij', 'uit', 'aan', 'om', 'over', 'ook', 'nog', 'al',
  'wel', 'niet', 'maar', 'dan', 'als', 'die', 'dat', 'wat', 'wie',
  'hoe', 'waar', 'er', 'hier', 'daar', 'je', 'we', 'ze', 'hij',
  'zijn', 'haar', 'hun', 'ons', 'wordt', 'werd', 'kan', 'zal',
  'moet', 'gaat', 'komt', 'heeft', 'meer', 'veel', 'eerste', 'nieuwe',
]);

// Extract meaningful keywords from text (ignoring stopwords and short words)
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Check similarity between two titles using keyword overlap
function isSimilarTitle(title1: string, title2: string): boolean {
  const kw1 = extractKeywords(title1);
  const kw2 = extractKeywords(title2);

  if (kw1.length === 0 || kw2.length === 0) return false;

  // Count overlapping keywords
  const set2 = new Set(kw2);
  const common = kw1.filter((w) => set2.has(w));

  // Use Jaccard similarity: overlap / union
  const union = new Set([...kw1, ...kw2]);
  const jaccard = common.length / union.size;

  // Also check if the important keywords (longer words = more specific) match
  const importantKw1 = kw1.filter((w) => w.length > 4);
  const importantKw2 = kw2.filter((w) => w.length > 4);
  const importantSet2 = new Set(importantKw2);
  const importantCommon = importantKw1.filter((w) => importantSet2.has(w));

  // Duplicate if: >40% Jaccard similarity OR >50% of important keywords match
  if (jaccard > 0.4) return true;
  if (importantKw1.length > 0 && importantCommon.length / importantKw1.length > 0.5) return true;

  return false;
}

// Skip regio-specifieke artikelen die niet relevant zijn voor NL/EU
function isRegionLocked(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  // US-specifieke sales events en feestdagen
  if (/\b(presidents day|memorial day|labor day|fourth of july|thanksgiving deal|prime day deal)\b/.test(text)) return true;
  // US-specifieke retailers (alleen als het over deals/sales gaat)
  if (/\b(best buy|walmart|target|gamestop)\b/.test(text) && /\b(deal|sale|discount|offer|save|price drop|clearance)\b/.test(text)) return true;
  // Expliciet regionaal geblokkeerde content
  if (/\b(us[- ]only|us[- ]exclusive|america[- ]only|north america[- ]only|available only in the us)\b/.test(text)) return true;
  return false;
}

// Determine category based on content
function detectCategory(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  if (/\breview\b|\bscore\b|\brating\b|\b\/10\b|\bverdic/i.test(text)) return 'Review';
    if (/\btransfer\b|\btransfers\b|\bcontract\b|\bhuurdeal\b/i.test(text)) return 'Transfers';
  if (/\btech\b|\bai\b|\bsoftware\b|\bupdate\b|\bpatch\b|\bdriver\b/i.test(text)) return 'Tech';
  if (/\bindie\b|\bindiega/i.test(text)) return 'Indie';
  if (/\bmod\b|\bmods\b|\bmodding\b/i.test(text)) return 'Mods';
  if (/\brumor\b|\brumour\b|\bgerucht\b|\bleak\b|\bgelekt\b/i.test(text)) return 'Gerucht';
  if (/\bopini[eo]\b|\bcolumn\b|\beditorial\b/i.test(text)) return 'Opinie';

  return 'Nieuws';
}

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin force override: skip limieten
  const url = new URL(req.url);
  const forceMode = url.searchParams.get('force') === 'true';
  const forceCount = Math.min(parseInt(url.searchParams.get('count') || '5', 10), 20);

  // Nederlandse tijd berekenen
  const nlTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' });
  const nlNow = new Date(nlTime);
  const nlHour = nlNow.getHours();
  const dayOfWeek = nlNow.getDay(); // 0 = zondag, 6 = zaterdag
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Nachtmodus: geen nieuws plaatsen tussen 23:00 en 06:00 (skip bij force)
  if (!forceMode && (nlHour >= 23 || nlHour < 6)) {
    return NextResponse.json({
      skipped: true,
      reason: `Nachtmodus actief (${nlHour}:00 NL tijd). Geen nieuws tussen 23:00-06:00.`,
    });
  }

  // Dagelijks maximum: tel artikelen die vandaag al zijn gepubliceerd
  const todayStart = new Date(nlNow);
  todayStart.setHours(0, 0, 0, 0);

  const DAILY_MAX = isWeekend ? 7 : 12;

  const todayCount = await sanityClient.fetch<number>(
    `count(*[_type == "post" && publishedAt >= $start])`,
    { start: todayStart.toISOString() }
  );

  if (!forceMode && todayCount >= DAILY_MAX) {
    return NextResponse.json({
      skipped: true,
      reason: `Dagelijks maximum bereikt: ${todayCount}/${DAILY_MAX} artikelen vandaag (${isWeekend ? 'weekend' : 'doordeweeks'}).`,
    });
  }

  // Budget-gebaseerd slot systeem (overgeslagen bij force mode)
  let maxThisRun: number;

  if (forceMode) {
    maxThisRun = forceCount;
  } else {
    const cronSlotsNL = [7, 9, 10, 12, 13, 15, 16, 18, 19, 21];
    const totalSlots = cronSlotsNL.length;
    const slotsPassed = cronSlotsNL.filter(h => h <= nlHour).length;
    const idealCount = Math.round((slotsPassed / totalSlots) * DAILY_MAX);
    const baseSlotMax = isWeekend ? 1 : Math.min(2, Math.ceil(DAILY_MAX / totalSlots));
    const deficit = Math.max(0, idealCount - todayCount);
    const slotMax = Math.min(baseSlotMax + (deficit > 0 ? 1 : 0), 3);
    const remaining = DAILY_MAX - todayCount;
    maxThisRun = Math.min(slotMax, remaining);
  }

  try {
    // Get existing originalUrl values to avoid duplicates
    const existing = await sanityClient.fetch<string[]>(
      `*[_type == "post" && defined(originalUrl)].originalUrl`
    );
    const existingUrls = new Set(existing);

    // Also get recent titles to avoid semantic duplicates
    const recentTitles = await sanityClient.fetch<string[]>(
      `*[_type == "post"] | order(publishedAt desc) [0...200].title`
    );

    const newItems: Array<{
      title: string;
      link: string;
      content: string;
      source: string;
      pubDate: string;
      category: string;
    }> = [];

    // Scan all feeds
    for (const feed of RSS_FEEDS) {
      try {
        const result = await parser.parseURL(feed.url);

        for (const item of result.items.slice(0, 10)) {
          if (!item.title || !item.link) continue;

          // Skip if already imported
          if (existingUrls.has(item.link)) continue;

          // Skip if title is too similar to recent articles (smart keyword matching)
          const itemTitle = item.title!;
          const isDuplicate = recentTitles.some((t) => isSimilarTitle(itemTitle, t));
          if (isDuplicate) continue;

          // Also skip if this batch already has a similar item (cross-feed dedup)
          const isDupInBatch = newItems.some((ni) => isSimilarTitle(itemTitle, ni.title));
          if (isDupInBatch) continue;

          const content = item.contentSnippet || item.content || '';

          // Skip regio-specifieke artikelen (US-only deals, sales events)
          if (isRegionLocked(itemTitle, content)) continue;
          const category = detectCategory(item.title, content);

          newItems.push({
            title: item.title,
            link: item.link,
            content: content.slice(0, 2000),
            source: feed.source,
            pubDate: item.pubDate || new Date().toISOString(),
            category,
          });
        }
      } catch (feedErr) {
        console.error(`Fout bij feed ${feed.source}:`, feedErr);
        // Continue with next feed
      }
    }

    // Dynamisch max per tijdslot (dagelijks max + weekend-detectie)
    const toProcess = newItems.slice(0, maxThisRun);

    // For each new item, call the generate API to create an article
    // Met 15s delay tussen requests om Pollinations rate limits te respecteren
    const baseUrl = 'https://www.dezestien.nl';

    const results = [];

    for (const item of toProcess) {
      // Random delay tussen artikelen (12-20s) — realistischer dan vast interval
      if (results.length > 0) {
        const delay = 12000 + Math.floor(Math.random() * 8000);
        await new Promise((r) => setTimeout(r, delay));
      }

      try {
        const genResponse = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({
            sourceTitle: item.title,
            sourceContent: item.content,
            sourceUrl: item.link,
            sourceName: item.source,
            category: item.category,
          }),
        });

        if (genResponse.ok) {
          const data = await genResponse.json();
          results.push({ title: item.title, status: 'ok', slug: data.slug });
        } else {
          const errText = await genResponse.text();
          results.push({ title: item.title, status: 'error', error: errText });
        }
      } catch (genErr: any) {
        results.push({ title: item.title, status: 'error', error: genErr.message });
      }
    }

    return NextResponse.json({
      scanned: RSS_FEEDS.length,
      found: newItems.length,
      processed: toProcess.length,
      dailyCount: todayCount + results.filter(r => r.status === 'ok').length,
      dailyMax: forceMode ? `${DAILY_MAX} (override)` : DAILY_MAX,
      isWeekend,
      forceMode,
      results,
    });
  } catch (error: any) {
    console.error('Cron scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Scan failed' },
      { status: 500 }
    );
  }
}
