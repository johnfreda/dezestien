import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { groq } from 'next-sanity';
import Link from 'next/link';
import Image from 'next/image';
import { Music, Headphones, Play, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Metadata } from 'next';
import { YouTubeEmbed, SpotifyEmbed } from '@/components/Embeds';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Voetbalpodcasts | DeZestien.nl',
  description: 'Luister naar de beste Nederlandse voetbal podcasts op één plek. Van Gamekings tot Power Unlimited.',
  alternates: { canonical: 'https://www.dezestien.nl/podcasts' },
  openGraph: {
    title: 'Voetbalpodcasts - DeZestien.nl',
    description: 'Alle Nederlandse voetbal podcasts op één plek',
    url: 'https://www.dezestien.nl/podcasts',
    siteName: 'DeZestien.nl',
    type: 'website',
  },
};

interface PodcastShow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: any;
  spotifyShowUrl?: string;
  applePodcastUrl?: string;
  youtubeChannelUrl?: string;
  websiteUrl?: string;
  episodeCount: number;
  latestEpisode?: string;
}

interface Episode {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  author?: string;
  youtubeEmbed?: string;
  spotifyEmbed?: string;
  applePodcastEmbed?: string;
  podcastExternalLink?: string;
  showName?: string;
  showSlug?: string;
  showSpotifyUrl?: string;
}

export default async function PodcastsPage() {
  // Haal alle shows op met episode count
  const showsQuery = groq`*[_type == "podcastShow"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    description,
    coverImage,
    spotifyShowUrl,
    applePodcastUrl,
    youtubeChannelUrl,
    websiteUrl,
    "episodeCount": count(*[_type == "post" && category == "Podcast" && podcastShow._ref == ^._id]),
    "latestEpisode": *[_type == "post" && category == "Podcast" && podcastShow._ref == ^._id] | order(publishedAt desc)[0].publishedAt
  }`;

  // Nieuwste afleveringen over alle shows
  const episodesQuery = groq`*[_type == "post" && category == "Podcast"] | order(publishedAt desc)[0...20] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    author,
    youtubeEmbed,
    spotifyEmbed,
    applePodcastEmbed,
    podcastExternalLink,
    "showName": podcastShow->name,
    "showSlug": podcastShow->slug.current,
    "showSpotifyUrl": podcastShow->spotifyShowUrl
  }`;

  const [shows, episodes]: [PodcastShow[], Episode[]] = await Promise.all([
    client.fetch(showsQuery),
    client.fetch(episodesQuery),
  ]);

  // Groepeer episodes per show
  const episodesByShow: Record<string, Episode[]> = {};
  for (const ep of episodes) {
    const key = ep.showSlug || '_onbekend';
    if (!episodesByShow[key]) episodesByShow[key] = [];
    episodesByShow[key].push(ep);
  }

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Voetbalpodcasts - DeZestien.nl',
    url: 'https://www.dezestien.nl/podcasts',
    description: 'Nederlandse voetbal podcasts verzameld op één plek',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: shows.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'PodcastSeries',
          name: s.name,
          url: `https://www.dezestien.nl/podcasts/${s.slug}`,
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <Headphones size={44} className="text-purple-500" />
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Voetbalpodcasts
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            De beste Nederlandse voetbal podcasts op één plek. Luister direct via Spotify, YouTube of Apple Podcasts.
          </p>
        </div>

        {/* Show Cards */}
        {shows.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Shows</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {shows.map((show) => (
                <Link
                  key={show._id}
                  href={`/podcasts/${show.slug}`}
                  className="group bg-[#111827] border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                >
                  <div className="aspect-square bg-gray-800 relative">
                    {show.coverImage?.asset ? (
                      <Image
                        src={urlFor(show.coverImage).width(300).height(300).url()}
                        alt={show.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={40} className="text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="text-white text-sm font-medium flex items-center gap-1">
                        <Play size={14} /> Bekijk show
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-semibold text-sm truncate group-hover:text-purple-400 transition-colors">
                      {show.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {show.episodeCount} aflevering{show.episodeCount !== 1 ? 'en' : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Nieuwste Afleveringen */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Nieuwste Afleveringen</h2>
          {episodes.length === 0 ? (
            <div className="text-center py-16 bg-[#111827] rounded-xl border border-gray-800">
              <Headphones size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Nog geen podcast afleveringen.</p>
              <p className="text-gray-500 text-sm mt-1">Voeg podcast shows toe in het CMS om te beginnen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {episodes.slice(0, 12).map((ep) => {
                const hasEmbed = ep.spotifyEmbed || ep.youtubeEmbed;

                return (
                  <article
                    key={ep._id}
                    className="bg-[#111827] border border-gray-800 rounded-xl p-4 md:p-5 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {ep.showName && (
                            <Link
                              href={`/podcasts/${ep.showSlug}`}
                              className="bg-purple-600/20 text-purple-400 text-xs font-semibold px-2.5 py-0.5 rounded-full hover:bg-purple-600/30 transition"
                            >
                              {ep.showName}
                            </Link>
                          )}
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock size={12} />
                            {formatDistanceToNow(new Date(ep.publishedAt), { addSuffix: true, locale: nl })}
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-lg leading-snug mb-2">
                          <Link href={`/artikel/${ep.slug}`} className="hover:text-purple-400 transition-colors">
                            {ep.title}
                          </Link>
                        </h3>
                        {ep.excerpt && (
                          <p className="text-gray-400 text-sm line-clamp-2">{ep.excerpt}</p>
                        )}
                      </div>

                      {/* Inline embedded player - YouTube first */}
                      {ep.youtubeEmbed && (
                        <div className="w-full">
                          <YouTubeEmbed url={ep.youtubeEmbed} />
                        </div>
                      )}
                      {!ep.youtubeEmbed && ep.spotifyEmbed && (
                        <div className="w-full">
                          <SpotifyEmbed url={ep.spotifyEmbed} />
                        </div>
                      )}

                      {/* Fallback: external link only if no embed */}
                      {!hasEmbed && ep.podcastExternalLink && (
                        <a
                          href={ep.podcastExternalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600/20 text-purple-400 text-sm font-medium rounded-lg hover:bg-purple-600/30 transition w-fit"
                        >
                          <Headphones size={14} /> Luister aflevering
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Per Show Secties */}
        {shows.map((show) => {
          const showEpisodes = episodesByShow[show.slug] || [];
          if (showEpisodes.length === 0) return null;

          return (
            <div key={show._id} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <Link
                  href={`/podcasts/${show.slug}`}
                  className="flex items-center gap-3 group"
                >
                  {show.coverImage?.asset && (
                    <Image
                      src={urlFor(show.coverImage).width(40).height(40).url()}
                      alt={show.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <h2 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                    {show.name}
                  </h2>
                </Link>
                <Link
                  href={`/podcasts/${show.slug}`}
                  className="text-purple-400 text-sm hover:text-purple-300 transition"
                >
                  Alle afleveringen &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                {showEpisodes.slice(0, 5).map((ep) => (
                  <Link
                    key={ep._id}
                    href={`/artikel/${ep.slug}`}
                    className="flex items-center gap-3 p-3 bg-[#111827] border border-gray-800/50 rounded-lg hover:border-purple-500/30 transition group"
                  >
                    <Play size={16} className="text-gray-500 group-hover:text-purple-400 flex-shrink-0 transition" />
                    <span className="text-white text-sm font-medium truncate group-hover:text-purple-400 transition">
                      {ep.title}
                    </span>
                    <span className="text-gray-600 text-xs ml-auto flex-shrink-0">
                      {formatDistanceToNow(new Date(ep.publishedAt), { addSuffix: true, locale: nl })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
