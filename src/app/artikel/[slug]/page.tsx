import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { groq } from 'next-sanity';
import { PortableText, toPlainText } from '@portabletext/react';
import { Clock, User, Calendar, Tag, ChevronLeft, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { TwitterEmbed, YouTubeEmbed, ApplePodcastEmbed, SpotifyEmbed } from '@/components/Embeds';
import Comments from '@/components/Comments';
// Auth/DB features disabled — pure news site for now
import ReadingProgress from '@/components/ReadingProgress';
import ShareButtons from '@/components/ShareButtons';
import RelatedArticles from '@/components/RelatedArticles';
import TableOfContents from '@/components/TableOfContents';
import AnimatedScore from '@/components/AnimatedScore';
import AdminEditBar from '@/components/AdminEditBar';
import { Metadata } from 'next';
// prisma disabled — no database yet
import { getHighScoreLabel } from '@/lib/score-labels';
import { getYouTubeThumbnailUrl } from '@/lib/youtube-utils';

export const revalidate = 60;

// Pre-render alle artikelpagina's bij build-time voor betere crawl-ervaring
export async function generateStaticParams() {
  const slugs = await client.fetch(groq`*[_type == "post"]{ "slug": slug.current }.slug`);
  return slugs.map((slug: string) => ({ slug }));
}

// Portable Text Components (voor YouTube/Twitter/Opmaak)
const ptComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlFor(value).width(800).fit('max').auto('format').url()}
            alt={value.alt || 'Artikel afbeelding'}
            width={800}
            height={450}
            className="rounded-lg w-full h-auto shadow-lg"
            loading="lazy"
            decoding="async"
          />
          {value.caption && (
            <figcaption className="text-center text-sm text-[var(--text-muted)] mt-2 italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    youtube: ({ value }: any) => {
      if (!value?.url) {
        console.error('YouTube embed missing URL:', value);
        return null;
      }
      return <YouTubeEmbed url={value.url} />;
    },
    twitter: ({ value }: any) => <TwitterEmbed url={value.url} />,
    externalImage: ({ value }: any) => {
        if (!value?.url) return null;
        return (
            <figure className="my-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={value.url}
                    alt={value.alt || 'Nieuws afbeelding'}
                    width={800}
                    height={450}
                    className="rounded-lg w-full h-auto shadow-lg"
                    loading="lazy"
                    decoding="async"
                />
                {value.alt && (
                    <figcaption className="text-center text-sm text-[var(--text-muted)] mt-2 italic">
                        {value.alt}
                    </figcaption>
                )}
            </figure>
        );
    },
  },
  marks: {
    link: ({value, children}: any) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined
      return (
        <a href={value?.href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} className="text-green-400 hover:text-green-300 underline decoration-green-500/30 underline-offset-4 transition-colors">
          {children}
        </a>
      )
    },
  },
  block: {
    normal: ({ children }: any) => <p className="mb-4 text-[var(--text-primary)] leading-relaxed text-lg">{children}</p>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold text-white mt-8 mb-4 border-l-4 border-green-600 pl-4">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold text-green-400 mt-6 mb-3">{children}</h3>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-6 bg-purple-500/10 rounded-r italic text-[var(--text-primary)]">
        {children}
      </blockquote>
    ),
  },
};

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

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  const query = groq`*[_type == "post" && slug.current == $slug][0] {
    title,
    excerpt,
    mainImage,
    youtubeEmbed,
    "podcastShowCover": podcastShow->coverImage,
    publishedAt,
    _updatedAt,
    author
  }`;

  const post = await client.fetch(query, { slug });

  if (!post) {
    return {
      title: 'Artikel Niet Gevonden | DeZestien.nl',
      description: 'Het opgevraagde artikel kon niet worden gevonden.'
    }
  }

  const ogImage = post.mainImage?.asset
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : post.youtubeEmbed
      ? getYouTubeThumbnailUrl(post.youtubeEmbed) || '/opengraph-image'
      : post.podcastShowCover?.asset
        ? urlFor(post.podcastShowCover).width(1200).height(630).url()
        : '/opengraph-image';
  const authorName = (post.author || 'DeZestien Redactie').replace(/\(GPT.*?\)/g, '').replace(/DeZestien AI/g, 'DeZestien Redactie').trim();

  return {
    title: `${post.title} | DeZestien.nl`,
    description: post.excerpt,
    alternates: {
        canonical: `https://www.dezestien.nl/artikel/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt || post.publishedAt,
      authors: [authorName],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ],
      siteName: 'DeZestien.nl'
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    }
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const query = groq`*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    excerpt,
    category,
    additionalCategories,
    author,
    publishedAt,
    _updatedAt,
    mainImage,
    body,
    score,
    matchResult,
    pros,
    cons,
    boxImage,
    platforms,
    reviewType,
    isHot,
    originalUrl,
    youtubeEmbed,
    applePodcastEmbed,
    spotifyEmbed,
    podcastExternalLink,
    "podcastShowCover": podcastShow->coverImage,
    "podcastShowName": podcastShow->name
  }`;

  const post = await client.fetch(query, { slug });

  if (!post) {
    notFound();
  }

  const categoryColor = getCategoryColor(post.category);

  // Terug-link op basis van categorie
  const categoryBackMap: Record<string, { slug: string; label: string }> = {
    'Review': { slug: 'reviews', label: 'Reviews' },
    'Special': { slug: 'specials', label: 'Specials' },
    'Feature': { slug: 'specials', label: 'Specials' },
    'Opinie': { slug: 'opinie', label: 'Opinie' },
    'Podcast': { slug: 'podcasts', label: 'Podcasts' },
    'Transfers': { slug: 'transfers', label: 'Transfers' },
    'Buitenland': { slug: 'buitenland', label: 'Buitenland' },
    'Video': { slug: 'videos', label: 'Videos' },
    'Gerucht': { slug: 'geruchten', label: 'Geruchten' },
    'Eerste Divisie': { slug: 'eerste-divisie', label: 'Eerste Divisie' },
    'Vrouwenvoetbal': { slug: 'vrouwenvoetbal', label: 'Vrouwenvoetbal' },
    'Nieuws': { slug: 'nieuws', label: 'Nieuws' },
  };
  const backInfo = categoryBackMap[post.category] || null;
  const backUrl = backInfo ? `/categorie/${backInfo.slug}` : '/';
  const backLabel = backInfo ? `Terug naar ${backInfo.label}` : 'Terug';

  // Bereken leestijd uit body tekst
  const plainText = post.body ? toPlainText(post.body) : '';
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Community ratings disabled — no database yet
  const communityRatingData = null;

  // JSON-LD voor Google (NewsArticle/Review + Breadcrumb)
  const baseSchema: any = {
    '@type': post.category === 'Review' ? 'Review' : 'NewsArticle',
    headline: post.title,
    name: post.title,
    image: post.mainImage?.asset ? [urlFor(post.mainImage).width(1200).height(800).url()] : [],
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.dezestien.nl/artikel/${slug}`,
    },
    publisher: {
        '@type': 'Organization',
        name: 'DeZestien.nl',
        logo: {
            '@type': 'ImageObject',
            url: 'https://www.dezestien.nl/android-chrome-512x512.png',
            width: 512,
            height: 512,
        }
    },
    description: post.excerpt,
    articleBody: plainText.slice(0, 5000),
    wordCount: wordCount,
    timeRequired: `PT${readingTime}M`,
  };

  // Link video naar het artikel schema
  if (post.youtubeEmbed) {
    let vid = '';
    const yt = post.youtubeEmbed;
    if (/^[\w-]{11}$/.test(yt.trim())) vid = yt.trim();
    else if (yt.includes('youtu.be/')) vid = yt.split('youtu.be/')[1]?.split('?')[0]?.trim() || '';
    else if (yt.includes('youtube.com/watch')) { try { vid = new URL(yt).searchParams.get('v') || ''; } catch {} }
    else if (yt.includes('youtube.com/embed/')) vid = yt.split('embed/')[1]?.split('?')[0]?.trim() || '';
    vid = vid.replace(/[^a-zA-Z0-9_-]/g, '');
    if (vid.length === 11) {
      baseSchema.video = {
        '@type': 'VideoObject',
        name: post.title,
        thumbnailUrl: `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${vid}`,
      };
    }
  }

  // Author: Person voor reviews, Organization voor nieuws
  const cleanAuthor = (post.author || 'DeZestien Redactie').replace(/\(GPT.*?\)/g, '').replace(/DeZestien AI/g, 'DeZestien Redactie').trim();
  if (post.category === 'Review') {
    baseSchema.author = [{
      '@type': 'Person',
      name: cleanAuthor,
      url: 'https://www.dezestien.nl'
    }];
  } else {
    baseSchema.author = [{
      '@type': 'Organization',
      name: 'DeZestien Redactie',
      url: 'https://www.dezestien.nl'
    }];
  }

  // Voeg Review-specifieke velden toe als het een review is
  if (post.category === 'Review' && post.score) {
    baseSchema.reviewRating = {
      '@type': 'Rating',
      ratingValue: post.score,
      bestRating: 100,
      worstRating: 0
    };
    baseSchema.itemReviewed = {
      '@type': 'VideoGame',
      name: post.matchResult || post.title
    };

    // aggregateRating disabled — no database yet
  }

  // VideoObject schema voor YouTube embeds
  let videoSchema: any = null;
  if (post.youtubeEmbed) {
    let videoId = '';
    const ytUrl = post.youtubeEmbed;
    if (/^[\w-]{11}$/.test(ytUrl.trim())) {
      videoId = ytUrl.trim();
    } else if (ytUrl.includes('youtu.be/')) {
      videoId = ytUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0]?.trim() || '';
    } else if (ytUrl.includes('youtube.com/watch')) {
      try { videoId = new URL(ytUrl).searchParams.get('v') || ''; } catch {}
    } else if (ytUrl.includes('youtube.com/embed/')) {
      videoId = ytUrl.split('embed/')[1]?.split('?')[0]?.split('&')[0]?.trim() || '';
    } else if (ytUrl.includes('youtube.com/shorts/')) {
      videoId = ytUrl.split('shorts/')[1]?.split('?')[0]?.split('&')[0]?.trim() || '';
    }
    videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');

    if (videoId && videoId.length === 11) {
      videoSchema = {
        '@type': 'VideoObject',
        name: post.title,
        description: post.excerpt || plainText.slice(0, 200),
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        uploadDate: post.publishedAt,
        contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  // FAQ Schema voor reviews met pros/cons
  const faqSchema = (post.category === 'Review' && post.pros?.length && post.cons?.length) ? {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Wat zijn de pluspunten van ${post.matchResult || post.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: post.pros.join(', ')
        }
      },
      {
        '@type': 'Question',
        name: `Wat zijn de minpunten van ${post.matchResult || post.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: post.cons.join(', ')
        }
      },
      ...(post.score ? [{
        '@type': 'Question',
        name: `Wat is de score van ${post.matchResult || post.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${post.matchResult || post.title} krijgt een score van ${post.score}/100 van de DeZestien redactie.${(() => { const lbl = getHighScoreLabel(post.category, post.score, post.reviewType); return lbl ? ` Dit is een ${lbl.text}!` : post.score >= 70 ? ' Een aanrader.' : ''; })()}`
        }
      }] : [])
    ]
  } : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        baseSchema,
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
                    name: post.category,
                    item: `https://www.dezestien.nl/categorie/${post.category.toLowerCase()}`
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: post.title,
                    item: `https://www.dezestien.nl/artikel/${slug}`
                }
            ]
        },
        ...(faqSchema ? [faqSchema] : []),
        ...(videoSchema ? [videoSchema] : [])
    ]
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-green-500 selection:text-white pb-20">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* HEADER IMAGE / HERO */}
      <div className="relative w-full h-[500px] md:h-[600px]">
        {post.mainImage?.asset ? (
          <Image
            src={urlFor(post.mainImage).width(1200).height(800).url()}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : post.youtubeEmbed && getYouTubeThumbnailUrl(post.youtubeEmbed) ? (
          <Image
            src={getYouTubeThumbnailUrl(post.youtubeEmbed)!}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : post.podcastShowCover?.asset ? (
          <Image
            src={urlFor(post.podcastShowCover).width(1200).height(800).url()}
            alt={post.podcastShowName || post.title}
            fill
            className="object-cover scale-150 blur-md brightness-50"
            priority
            sizes="100vw"
          />
        ) : post.category === 'Podcast' ? (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-[#0b0f19] to-purple-900/60" />
        ) : null}
        {/* Verbeterde Gradient overlay voor leesbaarheid */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/80 to-transparent" />
        
        <div className="absolute top-0 left-0 w-full p-4 z-20">
          <Link href={backUrl} className="inline-flex items-center text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur px-4 py-2 rounded-full text-sm font-bold">
            <ChevronLeft size={16} className="mr-1" /> {backLabel}
          </Link>
        </div>

        {/* HIGH SCORE BANNER (HEADER - TOP RIGHT) */}
        {post.score && (() => { const lbl = getHighScoreLabel(post.category, post.score, post.reviewType); return lbl ? (
            <div className="absolute top-0 right-0 p-4 z-20 hidden md:block">
                <div className="bg-purple-600 text-white text-xs font-black uppercase tracking-widest px-5 py-2 rounded-full shadow-lg border border-purple-400/30">
                    {lbl.text}
                </div>
            </div>
        ) : null; })()}

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-4xl mx-auto z-10 pb-12 md:pb-12 left-0 right-0">
          {/* Main Category Badge */}
          <span className={`inline-block px-3 py-1 ${categoryColor} text-white text-xs font-bold uppercase tracking-wider rounded-sm mb-4 shadow-lg mr-2`}>
            {post.category}
          </span>

          {/* Hot Badge */}
          {post.isHot && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-sm mb-4 shadow-lg mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              HOT
            </span>
          )}
          
          {/* Extra Categories Badges */}
          {post.additionalCategories && post.additionalCategories.map((cat: string) => (
             <span key={cat} className={`inline-block px-3 py-1 ${getCategoryColor(cat)} text-white text-xs font-bold uppercase tracking-wider rounded-sm mb-4 shadow-lg mr-2 opacity-90`}>
                {cat}
             </span>
          ))}

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 drop-shadow-xl">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm text-[var(--text-primary)] font-medium">
             <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <User size={16} className="text-green-400" />
                <span>{(post.author || 'DeZestien Redactie').replace(/\(GPT.*?\)/g, '').replace(/DeZestien AI/g, 'DeZestien Redactie').trim()}</span>
             </div>
             <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Calendar size={16} className="text-green-400" />
                <span>{new Date(post.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
             </div>
             <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Clock size={16} className="text-green-400" />
                <span>{readingTime} min leestijd</span>
             </div>
             {post.category === 'Review' && post.score && (
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-xl backdrop-blur-sm border border-[var(--border-primary)]/50">
                   {post.boxImage?.asset && (
                     <div className="w-10 h-14 rounded overflow-hidden shadow border border-gray-600/50 shrink-0">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img
                         src={urlFor(post.boxImage).width(80).height(112).url()}
                         alt="Box art"
                         className="w-full h-full object-cover"
                       />
                     </div>
                   )}
                   <AnimatedScore score={post.score} size={48} />
                   <div className="flex flex-col">
                     <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.18em]">
                       Reviewscore
                     </span>
                     {(post.matchResult || post.title) && (
                       <span className="text-[11px] text-[var(--text-primary)] font-semibold leading-tight max-w-[140px] truncate">
                         {post.matchResult || post.title.replace(/review/gi, '').trim()}
                       </span>
                     )}
                     {post.platforms && post.platforms.length > 0 && (
                       <div className="flex flex-wrap gap-1 mt-0.5">
                         {post.platforms.map((p: string) => (
                           <span key={p} className="text-[9px] text-gray-400 font-medium">
                             {p}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
                 {(() => { const lbl = getHighScoreLabel(post.category, post.score, post.reviewType); return lbl ? (
                   <div className="hidden md:flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg border border-purple-400/30">
                     {lbl.text}
                   </div>
                 ) : null; })()}
               </div>
             )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        
        {/* Intro / Lead */}
        <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl shadow-2xl border border-[var(--border-primary)] mb-10">
            <p className="text-lg md:text-2xl text-[var(--text-primary)] font-medium leading-relaxed italic border-l-4 border-green-500 pl-6">
                "{post.excerpt}"
            </p>
        </div>

        {/* INHOUDSOPGAVE */}
        <TableOfContents />

        {/* YouTube embed (voor alle categorieën) */}
        {post.youtubeEmbed && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Bekijk de video
            </h3>
            <YouTubeEmbed url={post.youtubeEmbed} />
          </div>
        )}

        {/* ARTICLE BODY */}
        <article className="prose prose-lg prose-invert max-w-none prose-headings:font-bold prose-a:text-green-400 hover:prose-a:text-green-300">
          <PortableText value={post.body} components={ptComponents} />
        </article>

        {/* SHARE BUTTONS (niet bij reviews — UserRating heeft eigen deel-knoppen) */}
        {post.category !== 'Review' && (
          <ShareButtons url={`https://www.dezestien.nl/artikel/${slug}`} title={post.title} />
        )}

        {/* PODCAST EMBEDS */}
        {post.category === 'Podcast' && (
          <div className="mt-12 space-y-8">
            {post.applePodcastEmbed && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Apple Podcasts
                </h3>
                <ApplePodcastEmbed url={post.applePodcastEmbed} />
              </div>
            )}

            {post.spotifyEmbed && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Spotify
                </h3>
                <SpotifyEmbed url={post.spotifyEmbed} />
              </div>
            )}

            {post.podcastExternalLink && (
              <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-primary)]">
                <a
                  href={post.podcastExternalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                >
                  <span>Bezoek Podcast Website</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Review verdict (community ratings coming later) */}

        {/* COMMENTS SECTIE */}
        <Comments slug={slug} />

        {/* GERELATEERDE ARTIKELEN */}
        <RelatedArticles
          currentSlug={slug}
          category={post.category}
          additionalCategories={post.additionalCategories}
        />

        {/* BACK TO HOME BUTTON */}
        <div className="mt-12 text-center pb-8 border-t border-[var(--border-primary)] pt-8">
            <Link
                href={backUrl}
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg border border-[var(--border-primary)] hover:border-green-500"
            >
                <ChevronLeft size={20} />
                {backLabel}
            </Link>
        </div>

        {/* Mana/View tracking disabled — no database yet */}

      </main>

      {/* BRONVERMELDING - Heel klein, helemaal onderaan de pagina */}
      {post.originalUrl && (
        <footer className="max-w-4xl mx-auto px-4 sm:px-6 mt-20 pb-8">
          <div className="text-right">
            <p className="text-[9px] text-gray-700 font-mono">
              Bron:{' '}
              <a
                href={post.originalUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors"
              >
                {new URL(post.originalUrl).hostname.replace('www.', '')}
              </a>
            </p>
          </div>
        </footer>
      )}

      {/* Admin Edit Bar - client component, handles own auth check */}
      <AdminEditBar
        post={{
          _id: post._id,
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
          score: post.score,
          body: post.body,
          mainImage: post.mainImage,
          boxImage: post.boxImage,
          pros: post.pros,
          cons: post.cons,
          isHot: post.isHot,
          platforms: post.platforms,
          reviewType: post.reviewType,
        }}
        slug={slug}
      />
    </div>
  );
}
