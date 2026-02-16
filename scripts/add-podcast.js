/**
 * Script om een podcast toe te voegen aan Sanity CMS
 * Gebruik: node scripts/add-podcast.js
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynww8bw3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // Moet ingesteld zijn in .env.local
});

async function addPodcast() {
  try {
    const youtubeUrl = 'https://youtu.be/e-9dUnUTqEY';
    
    // Extract video ID
    const videoId = 'e-9dUnUTqEY';
    
    // Basis podcast informatie
    // Je kunt deze aanpassen op basis van de daadwerkelijke podcast informatie
    const podcastData = {
      _type: 'post',
      title: 'Podcast Aflevering', // Pas dit aan naar de echte titel
      slug: {
        _type: 'slug',
        current: `podcast-${Date.now()}`, // Unieke slug
      },
      category: 'Podcast',
      author: 'Redactie',
      publishedAt: new Date().toISOString(),
      excerpt: 'Luister naar deze podcast aflevering over gaming en tech.',
      youtubeEmbed: youtubeUrl,
      // Voeg deze toe als je de Spotify/Apple Podcast URLs hebt:
      // spotifyEmbed: 'https://open.spotify.com/episode/...',
      // applePodcastEmbed: 'https://podcasts.apple.com/.../id...',
      // podcastExternalLink: 'https://...',
      body: [
        {
          _type: 'block',
          _key: 'intro',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'Luister naar deze podcast aflevering.',
              marks: [],
            },
          ],
          markDefs: [],
        },
      ],
    };

    console.log('Podcast toevoegen aan Sanity...');
    const result = await client.create(podcastData);
    
    console.log('✅ Podcast succesvol toegevoegd!');
    console.log('ID:', result._id);
    console.log('Titel:', result.title);
    console.log('Slug:', result.slug?.current);
    console.log('\nJe kunt de podcast nu bewerken in Sanity Studio:');
    console.log(`https://manabalk-nl.sanity.studio/desk/post;${result._id}`);
    
  } catch (error) {
    console.error('❌ Fout bij toevoegen podcast:', error);
    if (error.message) {
      console.error('Foutmelding:', error.message);
    }
    process.exit(1);
  }
}

addPodcast();
