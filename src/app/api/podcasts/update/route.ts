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
    const { podcastId, title, excerpt, spotifyUrl, applePodcastUrl, externalLink, youtubeUrl } = await req.json();

    if (!podcastId) {
      return NextResponse.json({ error: 'Podcast ID is verplicht' }, { status: 400 });
    }

    const updateData: any = {};

    if (title) {
      updateData.title = title;
      // Update slug als titel verandert
      updateData.slug = {
        _type: 'slug',
        current: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 96),
      };
    }

    if (excerpt) {
      updateData.excerpt = excerpt;
    }

    if (youtubeUrl) {
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
        videoId = youtubeUrl;
      }
      updateData.youtubeEmbed = `https://youtu.be/${videoId}`;
    }

    if (spotifyUrl) {
      updateData.spotifyEmbed = spotifyUrl;
    }

    if (applePodcastUrl) {
      updateData.applePodcastEmbed = applePodcastUrl;
    }

    if (externalLink) {
      updateData.podcastExternalLink = externalLink;
    }

    // Update body if excerpt changed
    if (excerpt) {
      updateData.body = [
        {
          _type: 'block',
          _key: 'intro',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: excerpt,
              marks: [],
            },
          ],
          markDefs: [],
        },
      ];
    }

    const result = await writeClient
      .patch(podcastId)
      .set(updateData)
      .commit();

    return NextResponse.json({ 
      success: true, 
      podcast: {
        id: result._id,
        title: result.title,
        slug: result.slug?.current,
      }
    });

  } catch (error: any) {
    console.error('Error updating podcast:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij updaten podcast' },
      { status: 500 }
    );
  }
}
