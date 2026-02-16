'use client';

import { Tweet } from 'react-tweet';

export function YouTubeEmbed({ url }: { url: string }) {
  // Robuuste URL parser voor YouTube ID
  // Ondersteunt: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, en alleen de video ID
  let videoId = '';
  
  if (!url) {
    console.error('YouTubeEmbed: No URL provided');
    return null;
  }

  try {
    // Als het alleen een video ID is (11 karakters)
    if (/^[\w-]{11}$/.test(url.trim())) {
      videoId = url.trim();
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0]?.trim() || '';
    } else if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0]?.trim() || '';
    } else if (url.includes('youtube.com/v/')) {
      videoId = url.split('v/')[1]?.split('?')[0]?.split('&')[0]?.trim() || '';
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('shorts/')[1]?.split('?')[0]?.split('&')[0]?.trim() || '';
    }
    
    // Extra cleanup: verwijder eventuele trailing slashes of andere tekens
    videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
  } catch (e) {
    console.error('Invalid YouTube URL:', url, e);
  }

  if (!videoId || videoId.length !== 11) {
    console.error('YouTubeEmbed: Could not extract valid video ID from URL:', url);
    return null;
  }

  return (
    <div className="my-8 rounded-xl overflow-hidden shadow-lg border border-[var(--border-primary)] bg-black aspect-video relative">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}

export function TwitterEmbed({ url }: { url: string }) {
  const id = url.split('/').pop()?.split('?')[0];
  if (!id) return null;

  return (
    <div className="my-8 flex justify-center theme-dark">
      <div className="w-full max-w-[550px]">
        <Tweet id={id} />
      </div>
    </div>
  );
}

export function ApplePodcastEmbed({ url }: { url: string }) {
  if (!url) return null;

  // Extract podcast ID from Apple Podcast URL
  // Format: https://podcasts.apple.com/nl/podcast/.../id123456789
  let podcastId = '';
  try {
    const match = url.match(/\/id(\d+)/);
    if (match) {
      podcastId = match[1];
    } else {
      // Try to extract from other formats
      const urlParts = url.split('/');
      const idPart = urlParts.find(part => part.startsWith('id'));
      if (idPart) {
        podcastId = idPart.replace('id', '');
      }
    }
  } catch (e) {
    console.error('Invalid Apple Podcast URL:', url, e);
  }

  if (!podcastId) {
    return (
      <div className="my-8 p-4 bg-gray-800 rounded-lg border border-[var(--border-primary)]">
        <p className="text-gray-400 text-sm">Ongeldige Apple Podcast URL</p>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-xl overflow-hidden shadow-lg border border-[var(--border-primary)] bg-black">
      <iframe
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        frameBorder="0"
        height="450"
        style={{ width: '100%', maxWidth: '660px', overflow: 'hidden', background: 'transparent' }}
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src={`https://embed.podcasts.apple.com/nl/podcast/id${podcastId}?theme=dark`}
        title="Apple Podcast Embed"
      />
    </div>
  );
}

export function YouTubePlaylistEmbed({ url }: { url: string }) {
  if (!url) return null;

  let listId = '';
  try {
    if (url.includes('list=')) {
      const urlObj = new URL(url);
      listId = urlObj.searchParams.get('list') || '';
    }
  } catch (e) {
    console.error('Invalid YouTube Playlist URL:', url, e);
  }

  if (!listId) return null;

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border border-[var(--border-primary)] bg-black aspect-video relative">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/videoseries?list=${listId}&theme=dark`}
        title="YouTube Playlist"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}

export function SpotifyEmbed({ url }: { url: string }) {
  if (!url) return null;

  // Extract Spotify ID from URL
  // Format: https://open.spotify.com/episode/... or https://open.spotify.com/show/...
  let embedId = '';
  let embedType = 'episode';
  
  try {
    if (url.includes('/episode/')) {
      embedType = 'episode';
      const parts = url.split('/episode/');
      embedId = parts[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (url.includes('/show/')) {
      embedType = 'show';
      const parts = url.split('/show/');
      embedId = parts[1]?.split('?')[0]?.split('&')[0] || '';
    }
  } catch (e) {
    console.error('Invalid Spotify URL:', url, e);
  }

  if (!embedId) {
    return (
      <div className="my-8 p-4 bg-gray-800 rounded-lg border border-[var(--border-primary)]">
        <p className="text-gray-400 text-sm">Ongeldige Spotify URL</p>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-xl overflow-hidden shadow-lg border border-[var(--border-primary)] bg-black">
      <iframe
        style={{ borderRadius: '12px' }}
        src={`https://open.spotify.com/embed/${embedType}/${embedId}?utm_source=generator&theme=0`}
        width="100%"
        height="352"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Embed"
      />
    </div>
  );
}
