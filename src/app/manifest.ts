import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DeZestien.nl - Nederlands Voetbalnieuws, Transfers & Analyse',
    short_name: 'DeZestien',
    description: 'Jouw dagelijkse bron voor Nederlands voetbalnieuws. Eredivisie, transfers, Champions League, Oranje en meer.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    lang: 'nl',
    categories: ['news', 'sports'],
    background_color: '#0a1628',
    theme_color: '#0a1628',
    icons: [
      { src: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
