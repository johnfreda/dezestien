import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'ynww8bw3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// YouTube channel IDs per show
const channels = [
  { showName: 'Ron en Erik Podcast', channelId: 'UCEBmVNwdGQU2joqW7ZJv2fA' },
  { showName: 'Game Kast', channelId: 'UC4pDHMF-W0XpmSBoEZO3oIg' },
  { showName: 'Side Quest', channelId: 'UCiLSZCdbCYc7iJzsBfV5gLw' },  // IGN Benelux
  { showName: 'Power Unlimited Podcast', channelId: 'UCgN6VM0MKJ1W7EwjX9qIPhg' },  // ID Games
];

// Normalize title for fuzzy matching
function normalize(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two titles are similar enough to be a match
function titlesMatch(sanityTitle, ytTitle) {
  const a = normalize(sanityTitle);
  const b = normalize(ytTitle);

  // Exact match
  if (a === b) return true;

  // One contains the other
  if (a.includes(b) || b.includes(a)) return true;

  // Extract episode number if present (e.g. #594, #282, etc.)
  const numA = sanityTitle.match(/#(\d+)/);
  const numB = ytTitle.match(/#(\d+)/);
  if (numA && numB && numA[1] === numB[1]) return true;

  // Check word overlap (at least 60% of words match)
  const wordsA = a.split(' ').filter(w => w.length > 2);
  const wordsB = b.split(' ').filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const common = wordsA.filter(w => wordsB.includes(w));
  const overlapRatio = common.length / Math.min(wordsA.length, wordsB.length);
  return overlapRatio >= 0.6;
}

async function fetchYouTubeVideos(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Failed to fetch YouTube RSS: ${res.status}`);
    return [];
  }

  const xml = await res.text();
  const videos = [];

  // Simple XML parsing for video entries
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const idMatch = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
    if (titleMatch && idMatch) {
      videos.push({
        title: titleMatch[1].trim(),
        url: `https://youtu.be/${idMatch[1].trim()}`,
      });
    }
  }

  return videos;
}

async function main() {
  console.log('Fetching all podcast episodes from Sanity...');

  const episodes = await client.fetch(
    `*[_type == "post" && category == "Podcast" && !defined(youtubeEmbed)] {
      _id,
      title,
      "showName": podcastShow->name
    }`
  );

  console.log(`Found ${episodes.length} episodes without YouTube embed\n`);

  let totalMatched = 0;

  for (const channel of channels) {
    console.log(`\n=== ${channel.showName} (${channel.channelId}) ===`);

    const videos = await fetchYouTubeVideos(channel.channelId);
    console.log(`  Found ${videos.length} YouTube videos`);

    const showEpisodes = episodes.filter(ep => ep.showName === channel.showName);
    console.log(`  Found ${showEpisodes.length} Sanity episodes without embed`);

    let matched = 0;
    for (const ep of showEpisodes) {
      const matchedVideo = videos.find(v => titlesMatch(ep.title, v.title));
      if (matchedVideo) {
        console.log(`  MATCH: "${ep.title}" -> ${matchedVideo.url}`);
        await client.patch(ep._id).set({ youtubeEmbed: matchedVideo.url }).commit();
        matched++;
        totalMatched++;
      }
    }

    console.log(`  Matched ${matched}/${showEpisodes.length} episodes`);
  }

  console.log(`\n=== Done! Total matched: ${totalMatched} ===`);
}

main();
