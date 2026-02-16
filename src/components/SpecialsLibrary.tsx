'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, Clock, Flame, History, Newspaper, CalendarDays, TrendingUp, BarChart3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

type SpecialFilter = 'all' | 'week-in-voetbal' | 'voetbal-geschiedenis' | 'midweek-check' | 'weekend-voetbal' | 'maandoverzicht'

interface Special {
  slug: string
  title: string
  imageUrl: string | null
  publishedAt: string
  excerpt: string
  specialType: string | null
  isHot?: boolean
}

const specialTypeLabels: Record<string, { label: string; icon: typeof History; color: string; activeColor: string }> = {
  'voetbal-geschiedenis': { label: 'Voetbalgeschiedenis', icon: History, color: 'bg-gray-800 text-gray-400 hover:text-white', activeColor: 'bg-amber-600 text-white' },
  'week-in-voetbal': { label: 'Week in Voetbal', icon: Newspaper, color: 'bg-gray-800 text-gray-400 hover:text-white', activeColor: 'bg-green-600 text-white' },
  'midweek-check': { label: 'Midweek Check', icon: CalendarDays, color: 'bg-gray-800 text-gray-400 hover:text-white', activeColor: 'bg-emerald-600 text-white' },
  'weekend-voetbal': { label: 'Weekend Voetbal', icon: TrendingUp, color: 'bg-gray-800 text-gray-400 hover:text-white', activeColor: 'bg-purple-600 text-white' },
  'maandoverzicht': { label: 'Maandoverzicht', icon: BarChart3, color: 'bg-gray-800 text-gray-400 hover:text-white', activeColor: 'bg-rose-600 text-white' },
}

const getSpecialTypeBadge = (type: string | null) => {
  if (!type) return null
  const config = specialTypeLabels[type]
  if (!config) return null
  return { label: config.label, color: config.activeColor }
}

export default function SpecialsLibrary({ specials }: { specials: Special[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<SpecialFilter>('all')

  const filtered = specials.filter((s) => {
    if (typeFilter !== 'all' && s.specialType !== typeFilter) return false

    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.excerpt?.toLowerCase().includes(q)
    )
  })

  // Tel per type
  const typeCounts = Object.keys(specialTypeLabels).reduce((acc, type) => {
    acc[type] = specials.filter(s => s.specialType === type).length
    return acc
  }, {} as Record<string, number>)

  // Specials zonder type
  const otherCount = specials.filter(s => !s.specialType || !specialTypeLabels[s.specialType]).length

  return (
    <div>
      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            typeFilter === 'all'
              ? 'bg-amber-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Alles <span className="text-xs opacity-70">({specials.length})</span>
        </button>
        {Object.entries(specialTypeLabels).map(([type, config]) => {
          const count = typeCounts[type] || 0
          if (count === 0) return null
          const Icon = config.icon
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type as SpecialFilter)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                typeFilter === type
                  ? config.activeColor
                  : config.color
              }`}
            >
              <Icon size={14} />
              {config.label} <span className="text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek specials..."
          className="w-full bg-[#111827] border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
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

      {/* Result count when searching or filtering */}
      {(search.trim() || typeFilter !== 'all') && (
        <p className="text-sm text-gray-500 mb-4">
          {filtered.length} {filtered.length === 1 ? 'special' : 'specials'} gevonden
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((special) => {
            const badge = getSpecialTypeBadge(special.specialType)
            return (
              <Link key={special.slug} href={`/artikel/${special.slug}`} className="group bg-[#111827] rounded-xl overflow-hidden border border-gray-800 hover:border-amber-600 transition-all shadow-lg hover:shadow-amber-900/20 flex flex-col">

                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={special.imageUrl || '/placeholder.jpg'}
                    alt={special.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent opacity-60" />

                  {special.isHot && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md">
                      <Flame size={12} fill="currentColor" /> HOT
                    </div>
                  )}

                  {badge && (
                    <div className={`absolute bottom-2 left-2 ${badge.color} text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm`}>
                      {badge.label}
                    </div>
                  )}
                  {!badge && (
                    <div className="absolute bottom-2 left-2 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm">
                      Special
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                    {special.title}
                  </h2>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-grow">
                    {special.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3 mt-auto">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(special.publishedAt), { addSuffix: true, locale: nl })}
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-amber-400 transition-colors font-bold">
                      Lees meer &rarr;
                    </span>
                  </div>
                </div>

              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-dashed border-gray-700">
          <h3 className="text-2xl font-bold text-gray-400 mb-2">
            Geen specials gevonden{typeFilter !== 'all' ? ` voor ${specialTypeLabels[typeFilter]?.label || typeFilter}` : ''}{search ? ` met "${search}"` : ''}
          </h3>
          <p className="text-gray-500">Probeer een andere zoekterm of filter.</p>
        </div>
      )}
    </div>
  )
}
