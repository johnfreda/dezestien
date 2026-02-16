import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, Trophy, ArrowRight } from 'lucide-react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { groq } from 'next-sanity'

export const metadata: Metadata = {
  title: 'Pagina niet gevonden',
  description: 'De pagina die je zoekt bestaat niet of is verplaatst. Bekijk het laatste voetbalnieuws op DeZestien.nl.',
}

const categories = [
  { name: 'Eredivisie', slug: 'eredivisie' },
  { name: 'Transfers', slug: 'transfers' },
  { name: 'Champions League', slug: 'champions-league' },
  { name: 'Oranje', slug: 'oranje' },
  { name: 'Analyse', slug: 'analyse' },
  { name: 'Buitenland', slug: 'buitenland' },
];

export default async function NotFound() {
  const recentArticles = await client.fetch(
    groq`*[_type == "post"] | order(publishedAt desc) [0...4] {
      title,
      "slug": slug.current,
      category,
      mainImage,
    }`
  ).catch(() => []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center text-center px-4 py-16">

      <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400 font-display mb-4 drop-shadow-2xl">
        404
      </h1>

      <div className="bg-red-500/10 border border-red-500/20 rounded-full px-6 py-2 mb-8">
        <span className="text-red-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
          <Trophy size={18} /> Buitenspel
        </span>
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        Deze pagina staat buitenspel.
      </h2>

      <p className="text-gray-400 text-lg max-w-md mb-10 leading-relaxed">
        De pagina die je zoekt is verplaatst, verwijderd of heeft nooit bestaan. Terug naar het veld?
      </p>

      <Link
        href="/"
        className="group relative inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white font-black py-4 px-8 rounded-xl transition-all transform hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(22,163,74,0.5)]"
      >
        <Home size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>TERUG NAAR DE AFTRAP</span>
      </Link>

      {recentArticles.length > 0 && (
        <div className="mt-16 w-full max-w-3xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
            Misschien zoek je dit?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentArticles.map((article: any) => (
              <Link
                key={article.slug}
                href={`/artikel/${article.slug}`}
                className="group flex items-center gap-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] hover:border-green-500/50 p-4 transition-all text-left"
              >
                {article.mainImage?.asset && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={urlFor(article.mainImage).width(128).height(128).url()}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-green-400 block mb-1">
                    {article.category}
                  </span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-green-400 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                </div>
                <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-green-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 w-full max-w-3xl">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
          Of browse per categorie
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categorie/${cat.slug}`}
              className="px-4 py-2 bg-gray-800 hover:bg-green-600 text-gray-400 hover:text-white text-sm font-semibold rounded-lg transition-colors border border-[var(--border-primary)] hover:border-green-500"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
