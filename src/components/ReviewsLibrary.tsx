'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, Gamepad2, Monitor, Clock, Flame, Film } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { getHighScoreLabel } from '@/lib/score-labels'

type ReviewType = 'all' | 'games' | 'hardware' | 'films'

interface Review {
  slug: string
  title: string
  imageUrl: string | null
  score: number
  gameTitle: string | null
  publishedAt: string
  excerpt: string
  category?: string
  isHardware?: boolean
  isFilmSerie?: boolean
  reviewType?: string
  isHot?: boolean
}

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'review': return 'bg-purple-600'
    case 'hardware': return 'bg-emerald-600'
    default: return 'bg-green-600'
  }
}

export default function ReviewsLibrary({ reviews }: { reviews: Review[] }) {
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReviewType>('all')

  const filtered = reviews.filter((r) => {
    if (typeFilter === 'hardware' && !r.isHardware) return false
    if (typeFilter === 'films' && !r.isFilmSerie) return false
    if (typeFilter === 'games' && (r.isHardware || r.isFilmSerie)) return false

    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      r.gameTitle?.toLowerCase().includes(q) ||
      r.excerpt?.toLowerCase().includes(q)
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  const gameCount = reviews.filter((r) => !r.isHardware && !r.isFilmSerie).length
  const hardwareCount = reviews.filter((r) => r.isHardware).length
  const filmCount = reviews.filter((r) => r.isFilmSerie).length

  return (
    <div>
      {/* Type filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            typeFilter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Alles <span className="text-xs opacity-70">({reviews.length})</span>
        </button>
        <button
          onClick={() => setTypeFilter('games')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
            typeFilter === 'games'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Gamepad2 size={14} />
          Games <span className="text-xs opacity-70">({gameCount})</span>
        </button>
        <button
          onClick={() => setTypeFilter('hardware')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
            typeFilter === 'hardware'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Monitor size={14} />
          Hardware <span className="text-xs opacity-70">({hardwareCount})</span>
        </button>
        <button
          onClick={() => setTypeFilter('films')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
            typeFilter === 'films'
              ? 'bg-rose-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Film size={14} />
          Films & Series <span className="text-xs opacity-70">({filmCount})</span>
        </button>
      </div>

      {/* Search + Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek reviews op titel of game..."
            className="w-full bg-[#111827] border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setSortBy('date')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === 'date'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Nieuwste
          </button>
          <button
            onClick={() => setSortBy('score')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === 'score'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Hoogste score
          </button>
        </div>
      </div>

      {/* Result count when searching or filtering */}
      {(search.trim() || typeFilter !== 'all') && (
        <p className="text-sm text-gray-500 mb-4">
          {sorted.length} {sorted.length === 1 ? 'review' : 'reviews'} gevonden
        </p>
      )}

      {/* Grid — identiek aan features pagina + score badge */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((review) => (
            <Link key={review.slug} href={`/artikel/${review.slug}`} className="group bg-[#111827] rounded-xl overflow-hidden border border-gray-800 hover:border-green-600 transition-all shadow-lg hover:shadow-green-900/20 flex flex-col">

              {/* Image */}
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={review.imageUrl || '/placeholder.jpg'}
                  alt={review.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent opacity-60" />

                {review.isHot && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md">
                    <Flame size={12} fill="currentColor" /> HOT
                  </div>
                )}

                <div className={`absolute bottom-2 left-2 ${getCategoryColor(review.category || 'Review')} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm`}>
                  {review.category || 'Review'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow relative">
                {/* High Score Label in Card Body */}
                {(() => { const lbl = getHighScoreLabel(review.category || 'Review', review.score, review.reviewType); return lbl ? (
                  <div className="absolute -top-3 right-4 bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg border border-purple-400/30">
                    {lbl.text}
                  </div>
                ) : null; })()}

                <h2 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-green-400 transition-colors line-clamp-2">
                  {review.title}
                </h2>
                <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-grow">
                  {review.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3 mt-auto">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(review.publishedAt), { addSuffix: true, locale: nl })}
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
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-dashed border-gray-700">
          <h3 className="text-2xl font-bold text-gray-400 mb-2">
            Geen reviews gevonden{typeFilter !== 'all' ? ` voor ${typeFilter}` : ''}{search ? ` met "${search}"` : ''}
          </h3>
          <p className="text-gray-500">Probeer een andere zoekterm of filter.</p>
        </div>
      )}
    </div>
  )
}
