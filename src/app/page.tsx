import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import HomeClient from '@/components/HomeClient';
import { groq } from 'next-sanity';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getYouTubeThumbnailUrl } from '@/lib/youtube-utils';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'DeZestien.nl - Het Laatste Voetbalnieuws, Reviews & Tech',
  description: 'Jouw dagelijkse bron voor voetbalnieuws, eerlijke reviews en diepgaande specials. Van nieuwe releases tot clubnieuws.',
  alternates: {
    canonical: 'https://www.dezestien.nl',
  },
};

export default async function Home() {
  // JSON-LD voor Homepage (Organization & WebSite)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.dezestien.nl/#website',
        name: 'DeZestien.nl',
        url: 'https://www.dezestien.nl',
        inLanguage: 'nl-NL',
        description: 'De snelste voetbalnieuwssite van Nederland. Elke dag vers nieuws, reviews en tech updates.',
        publisher: {
          '@id': 'https://www.dezestien.nl/#organization',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.dezestien.nl/#organization',
        name: 'DeZestien.nl',
        url: 'https://www.dezestien.nl',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.dezestien.nl/android-chrome-512x512.png',
          width: 512,
          height: 512,
        },
        description: 'Gaming nieuwssite met reviews, specials en community.',
      }
    ]
  };

  // Haal artikelen uit Sanity
  const query = groq`*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    category,
    mainImage,
    youtubeEmbed,
    "podcastShowCover": podcastShow->coverImage,
    author,
    publishedAt,
    isHot,
    score,
    gameTitle
  }[0...40]`;

  const articles = await client.fetch(query);

  const slugs = articles.map((a: any) => a.slug);

  // Gecachte Prisma queries — comment/view counts hoeven niet elke 60s ververst
  const getCachedCounts = unstable_cache(
    async (articleSlugs: string[]) => {
      const [counts, views] = await Promise.all([
        prisma.comment.groupBy({
          by: ['articleSlug'],
          where: { articleSlug: { in: articleSlugs } },
          _count: { articleSlug: true },
        }),
        prisma.articleView.findMany({
          where: { slug: { in: articleSlugs } },
        }),
      ]);

      const commentCounts = counts.reduce((acc, curr) => {
        acc[curr.articleSlug] = curr._count.articleSlug;
        return acc;
      }, {} as Record<string, number>);

      const viewCounts = views.reduce((acc, curr) => {
        acc[curr.slug] = curr.count;
        return acc;
      }, {} as Record<string, number>);

      return { commentCounts, viewCounts };
    },
    ['homepage-counts'],
    { revalidate: 300 } // 5 minuten cache
  );

  let commentCounts: Record<string, number> = {};
  let viewCounts: Record<string, number> = {};

  try {
    const cached = await getCachedCounts(slugs);
    commentCounts = cached.commentCounts;
    viewCounts = cached.viewCounts;
  } catch (e) {
    console.error('[Homepage] Prisma query failed, using empty counts:', e);
  }

  // Map Sanity data naar ons interne formaat
  const formattedArticles = articles.map((article: any) => ({
    id: article._id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    category: article.category,
    imageUrl: article.mainImage?.asset
      ? urlFor(article.mainImage).width(800).url()
      : article.youtubeEmbed
        ? getYouTubeThumbnailUrl(article.youtubeEmbed)
        : article.podcastShowCover?.asset
          ? urlFor(article.podcastShowCover).width(800).url()
          : null,
    author: (article.author || 'DeZestien Redactie').replace(/\(GPT.*?\)/g, '').replace(/DeZestien AI/g, 'DeZestien Redactie').trim() || 'DeZestien Redactie',
    publishedAt: article.publishedAt,
    isHot: article.isHot || false,
    score: article.score || null,
    score_display: article.score ? article.score : null,
    gameTitle: article.gameTitle || null
  }));

  // Eerste 3 (Nieuwste) voor hero
  // We sorteren NIET meer op 'isHot' om te voorkomen dat oud nieuws blijft plakken.
  // De Hero toont nu altijd de 3 laatste artikelen. 'isHot' is puur visueel.
  const heroArticles = formattedArticles.slice(0, 3);

  // De rest voor de news feed (voorkom dubbele als ze in hero staan)
  const heroIds = new Set(heroArticles.map((a: any) => a.id));
  const newsItems = formattedArticles.filter((a: any) => !heroIds.has(a.id));

  // Vind de nieuwste review voor de "Review Uitgelicht" widget
  const featuredReview = formattedArticles.find((a: any) => a.category === 'Review' && a.score > 0) || null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
          heroArticles={heroArticles}
          newsItems={newsItems}
          allArticles={formattedArticles} // Voor filteren en Highlight sectie
          commentCounts={commentCounts}
          viewCounts={viewCounts}
          featuredReview={featuredReview}
      />
    </>
  );
}
