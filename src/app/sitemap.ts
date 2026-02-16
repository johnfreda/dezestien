import { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.dezestien.nl'

  // Haal alle artikelen op met updatedAt voor betere freshness signals
  const posts = await client.fetch(groq`*[_type == "post"] {
    "slug": slug.current,
    publishedAt,
    _updatedAt,
    category
  }`)

  const postUrls = posts.map((post: any) => ({
    url: `${baseUrl}/artikel/${post.slug}`,
    lastModified: new Date(post._updatedAt || post.publishedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Verzamel unieke categorieen en maak categorie URLs
  const categoryMap: Record<string, string> = {
    'Nieuws': 'nieuws',
    'Review': 'reviews',
    'Special': 'specials',
    'Feature': 'specials',
    'Opinie': 'opinie',
    'Podcast': 'podcasts',
    'Hardware': 'hardware',
    'Tech': 'tech',
    'Video': 'videos',
    'Indie': 'indie',
    'Mods': 'mods',
    'Gerucht': 'geruchten',
  }

  const uniqueCategories = [...new Set(posts.map((p: any) => p.category).filter(Boolean))] as string[]
  const categoryUrls = uniqueCategories.map((cat: string) => {
    const categoryPosts = posts.filter((p: any) => p.category === cat)
    const newestDate = categoryPosts.reduce((latest: string, p: any) => {
      const d = p._updatedAt || p.publishedAt
      return d > latest ? d : latest
    }, categoryPosts[0]?._updatedAt || categoryPosts[0]?.publishedAt || new Date().toISOString())

    return {
      url: `${baseUrl}/categorie/${categoryMap[cat] || cat.toLowerCase()}`,
      lastModified: new Date(newestDate),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }
  })

  // Forum topics uit Prisma
  let forumTopicUrls: MetadataRoute.Sitemap = []
  try {
    const topics = await prisma.forumTopic.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    })
    forumTopicUrls = topics.map((t) => ({
      url: `${baseUrl}/forum/${t.id}`,
      lastModified: t.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    }))
  } catch {
    // Prisma niet beschikbaar tijdens build — skip forum topics
  }

  // Nieuwste forum activiteit voor de forum index pagina
  const forumLastMod = forumTopicUrls.length > 0
    ? forumTopicUrls[0].lastModified
    : new Date()

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: forumLastMod,
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/podcasts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/tip-de-redactie`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...categoryUrls,
    ...postUrls,
    ...forumTopicUrls,
  ]
}
