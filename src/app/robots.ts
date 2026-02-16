import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/studio', '/api', '/login', '/register', '/profile', '/mana', '/_next/', '/icon', '/apple-icon', '/favicon.ico', '/opengraph-image', '/twitter-image'],
    },
    sitemap: 'https://www.dezestien.nl/sitemap.xml',
  }
}
