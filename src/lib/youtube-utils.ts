/**
 * Extraheert YouTube video ID uit diverse URL-formaten.
 * Hergebruikt dezelfde parse-logica als Embeds.tsx.
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  let videoId = '';

  try {
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

    videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
  } catch {
    return null;
  }

  if (!videoId || videoId.length !== 11) return null;
  return videoId;
}

/**
 * Retourneert de YouTube thumbnail URL voor een video.
 * Gebruikt maxresdefault (1280x720) met hqdefault als conceptuele fallback.
 */
export function getYouTubeThumbnailUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
