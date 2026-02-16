import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { apiVersion, dataset, projectId } from '@/sanity/env';

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { youtubeUrl, title, excerpt, spotifyUrl, applePodcastUrl, externalLink } = await req.json();

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is verplicht' }, { status: 400 });
    }

    // Extract video ID from YouTube URL
    let videoId = '';
    if (youtubeUrl.includes('youtu.be/')) {
      videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (youtubeUrl.includes('youtube.com/watch')) {
      const url = new URL(youtubeUrl);
      videoId = url.searchParams.get('v') || '';
    } else if (youtubeUrl.includes('youtube.com/embed/')) {
      videoId = youtubeUrl.split('embed/')[1]?.split('?')[0] || '';
    } else {
      // Assume it's just the video ID
      videoId = youtubeUrl;
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Kon geen YouTube video ID vinden' }, { status: 400 });
    }

    // Generate slug from title or use timestamp
    const slugBase = title 
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 96)
      : `podcast-${Date.now()}`;

    const podcastData: any = {
      _type: 'post',
      title: title || 'Podcast Aflevering',
      slug: {
        _type: 'slug',
        current: slugBase,
      },
      category: 'Podcast',
      author: 'Redactie',
      publishedAt: new Date().toISOString(),
      excerpt: excerpt || 'Luister naar deze podcast aflevering over voetbal en tech.',
      youtubeEmbed: `https://youtu.be/${videoId}`,
      body: [
        {
          _type: 'block',
          _key: 'intro',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: excerpt || 'Luister naar deze podcast aflevering.',
              marks: [],
            },
          ],
          markDefs: [],
        },
      ],
    };

    // Add optional fields
    if (spotifyUrl) {
      podcastData.spotifyEmbed = spotifyUrl;
    }

    if (applePodcastUrl) {
      podcastData.applePodcastEmbed = applePodcastUrl;
    }

    if (externalLink) {
      podcastData.podcastExternalLink = externalLink;
    }

    const result = await writeClient.create(podcastData);

    return NextResponse.json({ 
      success: true, 
      podcast: {
        id: result._id,
        title: result.title,
        slug: result.slug?.current,
      }
    });

  } catch (error: any) {
    console.error('Error adding podcast:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij toevoegen podcast' },
      { status: 500 }
    );
  }
}
