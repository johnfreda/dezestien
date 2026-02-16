import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { groq } from 'next-sanity';
import Link from 'next/link';
import { ArrowLeft, Clock, Headphones } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { YouTubeEmbed, SpotifyEmbed, ApplePodcastEmbed } from '@/components/Embeds';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface ShowPageProps {
  params: Promise<{ show: string }>;
}

export async function generateMetadata({ params }: ShowPageProps): Promise<Metadata> {
  const { show: showSlug } = await params;
  const showData = await client.fetch(
    groq`*[_type == "podcastShow" && slug.current == $slug][0]{ name, description }`,
    { slug: showSlug }
  );

  if (!showData) return { title: 'Show niet gevonden | DeZestien.nl' };

  return {
    title: `${showData.name} - Podcast | DeZestien.nl`,
    description: showData.description || `Luister naar ${showData.name} op DeZestien.nl`,
    alternates: { canonical: `https://www.dezestien.nl/podcasts/${showSlug}` },
    openGraph: {
      title: `${showData.name} - DeZestien.nl`,
      description: showData.description || `Luister naar ${showData.name}`,
      url: `https://www.dezestien.nl/podcasts/${showSlug}`,
      siteName: 'DeZestien.nl',
      type: 'website',
    },
  };
}

export default async function ShowPage({ params }: ShowPageProps) {
  const { show: showSlug } = await params;

  const showQuery = groq`*[_type == "podcastShow" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    description,
    coverImage,
    spotifyShowUrl,
    applePodcastUrl,
    youtubeChannelUrl,
    websiteUrl
  }`;

  const episodesQuery = groq`*[_type == "post" && category == "Podcast" && podcastShow->slug.current == $slug] | order(publishedAt desc)[0...10] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    youtubeEmbed,
    spotifyEmbed,
    applePodcastEmbed,
    podcastExternalLink
  }`;

  const totalQuery = groq`count(*[_type == "post" && category == "Podcast" && podcastShow->slug.current == $slug])`;

  const [show, episodes, totalEpisodes] = await Promise.all([
    client.fetch(showQuery, { slug: showSlug }),
    client.fetch(episodesQuery, { slug: showSlug }),
    client.fetch(totalQuery, { slug: showSlug }),
  ]);

  if (!show) notFound();

  // JSON-LD PodcastSeries
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: show.name,
    description: show.description || `Nederlandse voetbal podcast: ${show.name}`,
    url: `https://www.dezestien.nl/podcasts/${show.slug}`,
    webFeed: show.spotifyShowUrl || show.applePodcastUrl || undefined,
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Terug link */}
        <Link
          href="/podcasts"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition mb-6"
        >
          <ArrowLeft size={16} />
          Alle podcasts
        </Link>

        {/* Show Header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {show.coverImage?.asset ? (
            <img
              src={urlFor(show.coverImage).width(200).height(200).url()}
              alt={show.name}
              className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover shadow-xl flex-shrink-0"
            />
          ) : (
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center flex-shrink-0">
              <Headphones size={48} className="text-[var(--text-muted)]" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{show.name}</h1>
            {show.description && (
              <p className="text-gray-400 text-lg leading-relaxed mb-4">{show.description}</p>
            )}
            <p className="text-[var(--text-muted)] text-sm">
              {totalEpisodes} aflevering{totalEpisodes !== 1 ? 'en' : ''}
            </p>
          </div>
        </div>

        {/* Afleveringen */}
        <h2 className="text-xl font-bold text-white mb-4">Laatste afleveringen</h2>

        {episodes.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)]">
            <Headphones size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-gray-400">Nog geen afleveringen gevonden.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((ep: any) => {
              const hasEmbed = ep.spotifyEmbed || ep.youtubeEmbed || ep.applePodcastEmbed;

              return (
                <article
                  key={ep._id}
                  className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden hover:border-purple-500/30 transition-all"
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(ep.publishedAt), { addSuffix: true, locale: nl })}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">
                      <Link href={`/artikel/${ep.slug}`} className="hover:text-purple-400 transition-colors">
                        {ep.title}
                      </Link>
                    </h3>
                    {ep.excerpt && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-3">{ep.excerpt}</p>
                    )}

                    {/* Embedded players - YouTube first, then Spotify, then Apple */}
                    {ep.youtubeEmbed && (
                      <div className="mt-3">
                        <YouTubeEmbed url={ep.youtubeEmbed} />
                      </div>
                    )}
                    {!ep.youtubeEmbed && ep.spotifyEmbed && (
                      <div className="mt-3">
                        <SpotifyEmbed url={ep.spotifyEmbed} />
                      </div>
                    )}
                    {!ep.youtubeEmbed && !ep.spotifyEmbed && ep.applePodcastEmbed && (
                      <div className="mt-3">
                        <ApplePodcastEmbed url={ep.applePodcastEmbed} />
                      </div>
                    )}

                    {/* Fallback: external link only if no embed available */}
                    {!hasEmbed && ep.podcastExternalLink && (
                      <div className="mt-3">
                        <a
                          href={ep.podcastExternalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600/20 text-purple-400 text-sm font-medium rounded-lg hover:bg-purple-600/30 transition"
                        >
                          <Headphones size={14} /> Luister aflevering
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
