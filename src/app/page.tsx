import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import HomeClient from '@/components/HomeClient';
import { groq } from 'next-sanity';
import { Metadata } from 'next';
import { getYouTubeThumbnailUrl } from '@/lib/youtube-utils';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'DeZestien.nl - Nederlands Voetbalnieuws, Transfers & Analyse',
  description: 'Jouw dagelijkse bron voor Nederlands voetbalnieuws. Eredivisie, transfers, Champions League, Oranje en meer. Scherpe analyse, geen ruis.',
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
        description: 'DeZestien.nl — Nederlands voetbalnieuws, transfers en analyse. Elke dag vers.',
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
        description: 'Nederlands voetbalnieuws met transfers, analyse en community.',
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

  // Comment/view counts disabled — no database yet
  const commentCounts: Record<string, number> = {};
  const viewCounts: Record<string, number> = {};

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
