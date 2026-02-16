import Link from 'next/link';
import Image from 'next/image';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { groq } from 'next-sanity';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

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

interface RelatedArticlesProps {
  currentSlug: string;
  category: string;
  additionalCategories?: string[];
}

export default async function RelatedArticles({ currentSlug, category, additionalCategories }: RelatedArticlesProps) {
  const categories = [category, ...(additionalCategories || [])];

  const query = groq`*[_type == "post" && slug.current != $currentSlug && (category in $categories || count((additionalCategories[])[@ in $categories]) > 0)] | order(publishedAt desc) [0...4] {
    title,
    "slug": slug.current,
    category,
    mainImage,
    publishedAt,
    score
  }`;

  const articles = await client.fetch(query, { currentSlug, categories });

  if (!articles || articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-800 pt-10">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
        Meer over dit onderwerp
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article: any) => (
          <Link
            key={article.slug}
            href={`/artikel/${article.slug}`}
            className="group flex gap-4 bg-[#111827] rounded-xl border border-gray-800 hover:border-green-500/50 p-4 transition-all hover:shadow-lg hover:shadow-green-900/10"
          >
            {article.mainImage?.asset && (
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                <Image
                  src={urlFor(article.mainImage).width(200).height(200).url()}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="96px"
                />
              </div>
            )}
            <div className="flex flex-col justify-between min-w-0 flex-1">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-block px-2 py-0.5 ${getCategoryColor(article.category)} text-white text-[9px] font-bold uppercase tracking-wider rounded-sm`}>
                    {article.category}
                  </span>
                  {article.score && (
                    <span className="text-xs font-bold text-green-400">{article.score}/100</span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-200 group-hover:text-green-400 transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h3>
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                <Clock size={12} />
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: nl })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
