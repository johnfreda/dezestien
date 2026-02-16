import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { groq } from 'next-sanity';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, MessageSquare, Flame, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Metadata } from 'next';
import ReviewsLibrary from '@/components/ReviewsLibrary';
import SpecialsLibrary from '@/components/SpecialsLibrary';
import { getHighScoreLabel } from '@/lib/score-labels';

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

// Specifieke meta descriptions per categorie voor betere CTR in Google
import { categoryDescriptions } from "./category-descriptions";

// Dynamische Metadata voor Categorie Pagina's (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const title = slug.charAt(0).toUpperCase() + slug.slice(1);
    const description = categoryDescriptions[slug.toLowerCase()] || `Alle artikelen over ${title} op DeZestien.nl. Nieuws, reviews en meer.`;

    return {
        title: `${title} | DeZestien.nl`,
        description,
        alternates: {
            canonical: `https://www.dezestien.nl/categorie/${slug}`,
        },
        openGraph: {
            title: `${title} - DeZestien.nl`,
            description,
            url: `https://www.dezestien.nl/categorie/${slug}`,
            siteName: 'DeZestien.nl',
            type: 'website'
        }
    };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  
  // Mapping URL slug (meervoud) -> Sanity Category (enkelvoud)
  // URL: /categorie/reviews -> Sanity: "Review"
  let categoryFilter = slug;
  if (slug.toLowerCase() === 'eredivisie') categoryFilter = 'Eredivisie';
  if (slug.toLowerCase() === 'champions-league') categoryFilter = 'Champions League';
  if (slug.toLowerCase() === 'opinies' || slug.toLowerCase() === 'opinie') categoryFilter = 'Opinie';
  if (slug.toLowerCase() === 'podcasts' || slug.toLowerCase() === 'podcast') categoryFilter = 'Podcast';
  if (slug.toLowerCase() === 'geruchten') categoryFilter = 'Gerucht';
  if (slug.toLowerCase() === 'videos') categoryFilter = 'Video';
  if (slug.toLowerCase() === 'nieuws') categoryFilter = 'Nieuws';
  if (slug.toLowerCase() === 'europa-league') categoryFilter = 'Europa League';
  if (slug.toLowerCase() === 'conference-league') categoryFilter = 'Conference League';
  if (slug.toLowerCase() === 'transfers') categoryFilter = 'Transfers';
  if (slug.toLowerCase() === 'buitenland') categoryFilter = 'Buitenland';
  if (slug.toLowerCase() === 'oranje') categoryFilter = 'Oranje';
  if (slug.toLowerCase() === 'eerste-divisie') categoryFilter = 'Eerste Divisie';
  if (slug.toLowerCase() === 'vrouwenvoetbal') categoryFilter = 'Vrouwenvoetbal';
  if (slug.toLowerCase() === 'analyse') categoryFilter = 'Analyse';

  // Query: Zoek posts waar category (lowercase) matcht
  // Voor reviews: haal extra velden op (gameTitle, pros, cons, author)
  const isReviewPage = slug.toLowerCase() === 'reviews';
  const isSpecialsPage = slug.toLowerCase() === 'specials' || slug.toLowerCase() === 'features';

  const query = isReviewPage
    ? groq`*[_type == "post" && lower(category) == lower($categoryFilter)] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      category,
      reviewType,
      mainImage,
      boxImage,
      platforms,
      publishedAt,
      isHot,
      score,
      gameTitle,
      pros,
      cons,
      author
    }`
    : isSpecialsPage
    ? groq`*[_type == "post" && lower(category) in ["special", "feature"]] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      category,
      specialType,
      mainImage,
      publishedAt,
      isHot,
      score
    }`
    : groq`*[_type == "post" && lower(category) == lower($categoryFilter)] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      category,
      mainImage,
      publishedAt,
      isHot,
      score
    }`;

  const posts = await client.fetch(query, { categoryFilter });

  // Capitalize slug voor titel display
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);

  // JSON-LD voor CollectionPage + BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `${title} Archief`,
        url: `https://www.dezestien.nl/categorie/${slug}`,
        description: categoryDescriptions[slug.toLowerCase()] || `Overzicht van alle artikelen in categorie ${title}.`,
        inLanguage: 'nl-NL',
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: posts.map((post: any, index: number) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `https://www.dezestien.nl/artikel/${post.slug}`,
                name: post.title
            }))
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://www.dezestien.nl'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: title,
            item: `https://www.dezestien.nl/categorie/${slug}`
          }
        ]
      }
    ]
  };

  // Helper voor categorie kleuren (consistent met home)
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'review': return 'bg-purple-600';
      case 'special': case 'feature': return 'bg-amber-600';
      case 'opinie': return 'bg-orange-600';
      case 'podcast': return 'bg-violet-600';
      case 'hardware': return 'bg-emerald-600';
      case 'tech': return 'bg-emerald-600';
      case 'video': return 'bg-red-600';
      case 'gerucht': return 'bg-pink-600';
      case 'indie': return 'bg-lime-600';
      case 'mods': return 'bg-fuchsia-600';
      default: return 'bg-green-600';
    }
  };

  // Speciale library view voor specials
  if (isSpecialsPage) {
    const mappedSpecials = posts.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      imageUrl: p.mainImage?.asset ? urlFor(p.mainImage).width(600).height(400).url() : null,
      publishedAt: p.publishedAt,
      excerpt: p.excerpt || '',
      specialType: p.specialType || null,
      isHot: Boolean(p.isHot),
    }));
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-green-500 selection:text-white py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-primary)] pb-4">
            <h1 className="text-4xl md:text-5xl font-display font-black text-white italic uppercase tracking-tighter">
              Specials
            </h1>
            <span className="text-green-500 font-bold text-xl self-end mb-2">{posts.length} artikelen</span>
          </div>
          <SpecialsLibrary specials={mappedSpecials} />
        </div>
      </div>
    );
  }

  // Speciale library view voor reviews
  if (isReviewPage) {
    const mappedReviews = posts.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      imageUrl: p.mainImage?.asset ? urlFor(p.mainImage).width(600).height(400).url() : null,
      score: p.score || 0,
      gameTitle: p.gameTitle || null,
      publishedAt: p.publishedAt,
      excerpt: p.excerpt || '',
      category: p.category || 'Review',
      isHardware: p.reviewType === 'hardware',
      isFilmSerie: p.reviewType === 'film_serie',
      reviewType: p.reviewType || 'game',
      isHot: Boolean(p.isHot),
    }));
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-green-500 selection:text-white py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-primary)] pb-4">
            <h1 className="text-4xl md:text-5xl font-display font-black text-white italic uppercase tracking-tighter">
              {title}
            </h1>
            <span className="text-green-500 font-bold text-xl self-end mb-2">{posts.length} artikelen</span>
          </div>
          <ReviewsLibrary reviews={mappedReviews} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-green-500 selection:text-white py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-primary)] pb-4">
          <h1 className="text-4xl md:text-5xl font-display font-black text-white italic uppercase tracking-tighter">
            {title}
          </h1>
          <span className="text-green-500 font-bold text-xl self-end mb-2">{posts.length} artikelen</span>
        </div>

        {/* Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Link key={post._id} href={`/artikel/${post.slug}`} className="group bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border-primary)] hover:border-green-600 transition-all shadow-lg hover:shadow-green-900/20 flex flex-col">
                
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={post.mainImage?.asset ? urlFor(post.mainImage).width(600).height(400).url() : '/placeholder.jpg'}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent opacity-60" />

                  {post.isHot && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md">
                      <Flame size={12} fill="currentColor" /> HOT
                    </div>
                  )}

                  {/* Score Badge (Only for reviews) */}
                  {post.score && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                        {post.score}
                    </div>
                  )}

                  <div className={`absolute bottom-2 left-2 ${getCategoryColor(post.category)} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm`}>
                    {post.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow relative">
                   {/* High Score Label in Card Body */}
                   {(() => { const lbl = getHighScoreLabel(post.category, post.score); return lbl ? (
                        <div className="absolute -top-3 right-4 bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg border border-purple-400/30">
                            {lbl.text}
                        </div>
                   ) : null; })()}

                  <h2 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-green-400 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-grow">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-primary)] pt-3 mt-auto">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true, locale: nl })}
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-green-400 transition-colors font-bold">
                      Lees meer &rarr;
                    </span>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-dashed border-[var(--border-primary)]">
            <h3 className="text-2xl font-bold text-gray-400 mb-2">Nog geen artikelen in deze categorie</h3>
            <p className="text-[var(--text-muted)]">Ga naar de studio om iets te schrijven over {title}!</p>
            <Link href="/studio" className="inline-block mt-6 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors">
              Naar Studio
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
