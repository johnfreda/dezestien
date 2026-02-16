'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Clock, Flame, TrendingUp, Star, Eye, User, Lock } from 'lucide-react';
import { formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { getHighScoreLabel } from '@/lib/score-labels';
import AdminNewArticle from '@/components/AdminNewArticle';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  imageUrl: string | null;
  author: string;
  publishedAt: Date | string;
  isHot: boolean;
  score: number | null;
  gameTitle?: string | null;
};

interface HomeClientProps {
  heroArticles: Article[];
  newsItems: Article[];
  allArticles: Article[];
  commentCounts: Record<string, number>;
  viewCounts: Record<string, number>;
  featuredReview: Article | null;
}

export default function HomeClient({ heroArticles, newsItems, allArticles, commentCounts, viewCounts, featuredReview }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState('nieuws');
  const [itemsToShow, setItemsToShow] = useState(10); // Start with 10 items
  const [featuredReviewRating, setFeaturedReviewRating] = useState<{ average: number; count: number } | null>(null);

  // Fetch rating data for featured review
  useEffect(() => {
    if (featuredReview?.slug) {
      fetch(`/api/ratings?slug=${featuredReview.slug}`)
        .then(res => res.json())
        .then(data => setFeaturedReviewRating(data))
        .catch(err => console.error('Error fetching featured review rating:', err));
    }
  }, [featuredReview?.slug]);

  // Helper voor tijd
  const timeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: nl });
  };
  
  const timeShort = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
  };

  const dateShort = (date: Date | string) => {
    return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' });
  };

  // Meest gelezen artikelen (top 5)
  const mostReadArticles = [...allArticles]
      .sort((a, b) => (viewCounts[b.slug] || 0) - (viewCounts[a.slug] || 0))
      .slice(0, 5);

  // Dynamische kleuren per categorie
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'review': return { bg: 'bg-purple-600', text: 'text-purple-400', groupText: 'group-hover:text-purple-400', border: 'border-purple-600', glow: 'glow-purple' };
      case 'special': case 'feature': return { bg: 'bg-amber-600', text: 'text-amber-400', groupText: 'group-hover:text-amber-400', border: 'border-amber-600', glow: 'glow-amber' };
      case 'opinie': return { bg: 'bg-orange-600', text: 'text-orange-400', groupText: 'group-hover:text-orange-400', border: 'border-orange-600', glow: 'glow-orange' };
      case 'podcast': return { bg: 'bg-violet-600', text: 'text-violet-400', groupText: 'group-hover:text-violet-400', border: 'border-violet-600', glow: 'glow-violet' };
      case 'transfers': return { bg: 'bg-emerald-600', text: 'text-emerald-400', groupText: 'group-hover:text-emerald-400', border: 'border-emerald-600', glow: 'glow-cyan' };
      case 'buitenland': return { bg: 'bg-emerald-600', text: 'text-emerald-400', groupText: 'group-hover:text-emerald-400', border: 'border-emerald-600', glow: 'glow-emerald' };
      case 'video': return { bg: 'bg-red-600', text: 'text-red-400', groupText: 'group-hover:text-red-400', border: 'border-red-600', glow: 'glow-red' };
      case 'eerste-divisie': return { bg: 'bg-lime-600', text: 'text-lime-400', groupText: 'group-hover:text-lime-400', border: 'border-lime-600', glow: 'glow-lime' };
      case 'vrouwenvoetbal': return { bg: 'bg-fuchsia-600', text: 'text-fuchsia-400', groupText: 'group-hover:text-fuchsia-400', border: 'border-fuchsia-600', glow: 'glow-fuchsia' };
      case 'gerucht': return { bg: 'bg-pink-600', text: 'text-pink-400', groupText: 'group-hover:text-pink-400', border: 'border-pink-600', glow: 'glow-pink' };
      default: return { bg: 'bg-green-600', text: 'text-green-400', groupText: 'group-hover:text-green-400', border: 'border-green-600', glow: 'glow-blue' }; // Nieuws
    }
  };

  const groupArticlesByDate = (articles: Article[]) => {
    const groups: Record<string, Article[]> = {};
    const amsterdamTz = 'Europe/Amsterdam';
    
    // Get current time in Amsterdam timezone
    const now = toZonedTime(new Date(), amsterdamTz);
    
    articles.forEach(article => {
        const articleDate = new Date(article.publishedAt);
        // Convert article date to Amsterdam timezone for comparison
        const articleDateAmsterdam = toZonedTime(articleDate, amsterdamTz);
        
        // differenceInCalendarDays returns number of full days between dates
        // (dateLeft - dateRight). So (now - published)
        const diffDays = differenceInCalendarDays(now, articleDateAmsterdam);
        
        let label = '';
        if (diffDays <= 0) label = 'Vandaag'; // Includes future dates (timezone quirks)
        else if (diffDays === 1) label = 'Gisteren';
        else if (diffDays <= 4) label = `${diffDays} dagen geleden`;
        else label = 'Eerder'; 
        
        if (!groups[label]) groups[label] = [];
        groups[label].push(article);
    });
    
    return groups;
  };

  const filteredItems = activeTab === 'nieuws' 
    ? newsItems 
    : allArticles.filter(item => item.category === 'Review');

  // Filter mobile-only hero items uit de feed om duplicaten te voorkomen
  const heroIdsToExclude = new Set(heroArticles.slice(1, 3).map(item => item.id));
  const filteredItemsWithoutMobileHero = filteredItems.filter(item => !heroIdsToExclude.has(item.id));

  // Bepaal of de mobile hero items vandaag zijn (voor de 'Vandaag'-header)
  const amsterdamTzFeed = 'Europe/Amsterdam';
  const nowFeed = toZonedTime(new Date(), amsterdamTzFeed);
  const mobileHeroItemsForToday = heroArticles.slice(1, 3);
  const hasMobileTodayItems = mobileHeroItemsForToday.some(item => {
    const articleDate = toZonedTime(new Date(item.publishedAt), amsterdamTzFeed);
    const diffDays = differenceInCalendarDays(nowFeed, articleDate);
    return diffDays <= 0;
  });

  const groupedItems = groupArticlesByDate(filteredItemsWithoutMobileHero);
  const groupOrder = ['Vandaag', 'Gisteren', '2 dagen geleden', '3 dagen geleden', '4 dagen geleden', 'Eerder'];
  
  // Flatten grouped items for pagination
  const allGroupedItems: Article[] = [];
  groupOrder.forEach(label => {
    const items = groupedItems[label] || [];
    allGroupedItems.push(...items);
  });
  
  // Split items: recent (0-3 dagen) and older (3+ dagen)
  const recentItems: Article[] = [];
  const olderItems: Article[] = [];
  
  allGroupedItems.forEach(item => {
    const articleDate = new Date(item.publishedAt);
    const articleDateAmsterdam = toZonedTime(articleDate, amsterdamTzFeed);
    const diffDays = differenceInCalendarDays(nowFeed, articleDateAmsterdam);
    
    if (diffDays <= 3) {
      recentItems.push(item);
    } else {
      olderItems.push(item);
    }
  });
  
  // Always show all recent items, limit older items
  const displayedOlderItems = olderItems.slice(0, itemsToShow);
  const displayedItems = [...recentItems, ...displayedOlderItems];
  const hasMoreItems = olderItems.length > itemsToShow;
  
  // Re-group displayed items
  const displayedGroupedItems: Record<string, Article[]> = {};
  displayedItems.forEach(item => {
    const articleDate = new Date(item.publishedAt);
    const articleDateAmsterdam = toZonedTime(articleDate, amsterdamTzFeed);
    const diffDays = differenceInCalendarDays(nowFeed, articleDateAmsterdam);
    
    let label = '';
    if (diffDays <= 0) label = 'Vandaag';
    else if (diffDays === 1) label = 'Gisteren';
    else if (diffDays <= 4) label = `${diffDays} dagen geleden`;
    else label = 'Eerder';
    
    if (!displayedGroupedItems[label]) displayedGroupedItems[label] = [];
    displayedGroupedItems[label].push(item);
  });
  
  // Reset items to show when tab changes
  React.useEffect(() => {
    setItemsToShow(10);
  }, [activeTab]);

  // Helper om een feed item te renderen
  const renderFeedItem = (item: Article, isMobileOnly = false) => (
    <Link
        key={item.id}
        href={`/artikel/${item.slug}`}
        className={`group p-4 flex items-center hover:bg-gradient-to-r hover:from-gray-800/60 hover:to-transparent transition-all cursor-pointer relative ${isMobileOnly ? 'md:hidden' : ''}`}
    >
        {/* Time & Cat (Mobile Hidden) */}
        <div className="hidden sm:flex flex-col items-center w-24 text-center shrink-0 mr-4 gap-1.5">
            <span className={`inline-block px-2 py-0.5 ${getCategoryColor(item.category).bg} text-white text-[9px] font-black uppercase tracking-wider rounded-sm shadow-sm w-full truncate`}>
                {item.category}
            </span>
            <span className="text-gray-500 text-[10px] font-bold">{timeShort(item.publishedAt)}</span>
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0 pr-4">
            <h4 className={`text-sm md:text-base font-semibold truncate ${getCategoryColor(item.category).groupText} transition-colors ${item.isHot ? 'text-white' : 'text-gray-300'}`}>
            {item.title}
            {item.score && (() => { const lbl = getHighScoreLabel(item.category, item.score); return lbl ? (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase bg-gradient-to-r from-red-600 to-yellow-500 text-white align-middle animate-pulse">
                    {lbl.text}
                </span>
            ) : null; })()}
            </h4>
            <div className="flex sm:hidden items-center gap-2 text-xs text-gray-500 mt-1">
                <span className={`inline-block px-1.5 py-0.5 ${getCategoryColor(item.category).bg} text-white text-[8px] font-bold uppercase rounded-sm`}>
                    {item.category}
                </span>
                <span className="text-gray-400">{dateShort(item.publishedAt)}</span>
            </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 shrink-0">
            {item.isHot && (
            <span className="hidden sm:flex px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded uppercase border border-orange-500/20">
                Hot
            </span>
            )}
            <div className="flex items-center text-gray-500 text-xs group-hover:text-green-300 transition-colors">
            <MessageSquare size={14} className="mr-1.5" />
            {commentCounts[item.slug] || 0}
            </div>
        </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-300 font-sans selection:bg-green-500 selection:text-white">
      
      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HERO SECTION (PU Stijl) */}
        {heroArticles.length > 0 && (
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[500px]">
              
              {/* Main Feature */}
              <Link href={`/artikel/${heroArticles[0].slug}`} className={`md:col-span-2 relative group cursor-pointer rounded-2xl overflow-hidden border border-gray-800 shadow-2xl block h-[300px] md:h-full card-lift hover:border-gray-700 hover:${getCategoryColor(heroArticles[0].category).glow}`}>
                {heroArticles[0].imageUrl && (
                  <Image
                    src={heroArticles[0].imageUrl}
                    alt={heroArticles[0].title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                    sizes="(max-width: 768px) 100vw, 66vw"
                  />
                )}
                <div className="shimmer-hover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/40 to-transparent opacity-90" />
                
                {/* HIGH SCORE LABEL (90+) */}
                {heroArticles[0].score && (() => { const lbl = getHighScoreLabel(heroArticles[0].category, heroArticles[0].score); return lbl ? (
                  <div className="absolute top-0 left-0 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-br-xl shadow-lg z-20 border-b border-r border-purple-400/30">
                    {lbl.text}
                  </div>
                ) : null; })()}

                {/* Score Badge (if review) */}
                {heroArticles[0].score && (
                  <div className={`absolute top-6 right-6 ${getCategoryColor(heroArticles[0].category).bg}/90 text-white font-black text-xl w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 z-10`}>
                    {heroArticles[0].score}
                  </div>
                )}

                <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                  <span className={`inline-block px-3 py-1 ${getCategoryColor(heroArticles[0].category).bg} text-white text-xs font-bold uppercase tracking-wider rounded-sm mb-3 badge-shine`}>
                    {heroArticles[0].category}
                  </span>
                  <h1 className={`text-2xl md:text-5xl font-black text-white leading-tight mb-2 md:mb-3 ${getCategoryColor(heroArticles[0].category).groupText} transition-colors drop-shadow-lg line-clamp-2 md:line-clamp-3`}>
                    {heroArticles[0].title}
                  </h1>
                  <p className="text-gray-300 text-sm md:text-lg md:w-3/4 mb-2 md:mb-4 line-clamp-2 hidden sm:block">
                    {heroArticles[0].excerpt}
                  </p>
                  <div className="flex items-center text-xs md:text-sm text-gray-400 gap-4">
                    <span className="flex items-center gap-1"><Clock size={14}/> {timeAgo(heroArticles[0].publishedAt)}</span>
                    <span className={`font-semibold ${getCategoryColor(heroArticles[0].category).text} hidden sm:inline`}>door {heroArticles[0].author}</span>
                  </div>
                </div>
              </Link>

              {/* Side Features (DESKTOP ONLY) */}
              <div className="hidden md:flex flex-col gap-4 h-full">
                {heroArticles.slice(1, 3).map((item) => (
                  <Link key={item.id} href={`/artikel/${item.slug}`} className="relative flex-1 group cursor-pointer rounded-2xl overflow-hidden border border-gray-800 shadow-lg block h-auto card-lift hover:border-gray-700">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        priority
                        sizes="33vw"
                      />
                    )}
                    <div className="shimmer-hover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/60 to-transparent" />
                    
                    {/* HIGH SCORE LABEL (90+) - Small */}
                    {item.score && (() => { const lbl = getHighScoreLabel(item.category, item.score); return lbl ? (
                        <div className="absolute top-0 left-0 bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-br-lg shadow-lg z-20 border-b border-r border-purple-400/30">
                          {lbl.text}
                        </div>
                    ) : null; })()}

                    {item.score && (
                      <div className={`absolute top-4 right-4 ${getCategoryColor(item.category).bg}/90 text-white font-bold text-sm w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white/10 z-10`}>
                        {item.score}
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 p-4 md:p-5">
                      <span className={`inline-block px-2 py-0.5 ${getCategoryColor(item.category).bg} text-white text-[10px] font-bold uppercase tracking-wider rounded-sm mb-1 md:mb-2 badge-shine`}>
                        {item.category}
                      </span>
                      <h2 className={`text-lg md:text-xl font-bold text-white leading-tight ${getCategoryColor(item.category).groupText} transition-colors line-clamp-2`}>
                        {item.title}
                      </h2>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CONTENT GRID: Feed vs Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: News Feed (Tweakers Stijl) */}
          <div className="lg:col-span-8">
            <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden shadow-xl">
              
              {/* Feed Header */}
              <div className="px-4 md:px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#161e2e]">
                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Flame className="text-orange-500" size={20} />
                  {activeTab === 'reviews' ? 'Alle Reviews' : 'Laatste Updates'}
                </h3>
                <div className="flex bg-gray-900 rounded-lg p-1 text-[10px] md:text-xs font-bold">
                  <button 
                    onClick={() => setActiveTab('nieuws')}
                    className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'nieuws' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    NIEUWS
                  </button>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'reviews' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    REVIEWS
                  </button>
                </div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-gray-800">
                
                {/* 1. Mobile Only: De 2 gemiste Hero items - ALTIJD NA de headers */}
                {activeTab === 'nieuws' && heroArticles.slice(1, 3).length > 0 && (
                  <>
                    {/* Gebruik vooraf berekende flag om te bepalen of 'Vandaag'-header nodig is */}
                    {hasMobileTodayItems ? (
                      <>
                        <div className="bg-[#161e2e]/50 px-4 py-2 border-y border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                          Vandaag
                        </div>
                        {heroArticles.slice(1, 3).map((item) => renderFeedItem(item, true))}
                      </>
                    ) : (
                      heroArticles.slice(1, 3).map((item) => renderFeedItem(item, true))
                    )}
                  </>
                )}

                {/* 2. De reguliere feed - gegroepeerd */}
                {Object.keys(displayedGroupedItems).length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nog geen items in deze categorie.
                    </div>
                ) : (
                    groupOrder.map(label => {
                        const items = displayedGroupedItems[label];
                        if (!items || items.length === 0) return null;
                        
                        const showHeader = !(hasMobileTodayItems && label === 'Vandaag');
                        
                        return (
                            <React.Fragment key={label}>
                                {showHeader && (
                                  <div className="bg-[#161e2e]/50 px-4 py-2 border-y border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                                      {label}
                                  </div>
                                )}
                                {items.map((item) => renderFeedItem(item))}
                            </React.Fragment>
                        );
                    })
                )}
                
                {/* Load More Button - Only show if there are older items (3+ dagen) */}
                {hasMoreItems && (
                  <div className="px-4 py-4 border-t border-gray-800">
                    <button
                      onClick={() => setItemsToShow(prev => prev + 10)}
                      className="w-full py-3 text-center text-sm font-bold text-green-400 hover:text-green-300 hover:bg-gray-800/50 transition-colors uppercase tracking-widest rounded-lg border border-green-500/30 hover:border-green-500/50"
                    >
                      Laad meer nieuws
                    </button>
                  </div>
                )}
              </div>

              {/* View All Link - Only show if no "Load More" button */}
              {!hasMoreItems && (
                <Link 
                  href={activeTab === 'reviews' ? "/categorie/reviews" : "/categorie/nieuws"}
                  className="block w-full py-4 text-center text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors uppercase tracking-widest"
                >
                  MEER {activeTab === 'reviews' ? 'REVIEWS' : 'NIEUWS'} BEKIJKEN
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (Trending, Ads, etc) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Trending Block (DYNAMIC) */}
            <div className="glass rounded-xl p-6 shadow-lg">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <TrendingUp size={16} /> Meest Gelezen
              </h4>
              <ul className="space-y-4">
                {mostReadArticles.length > 0 ? (
                    mostReadArticles.map((article, idx) => (
                    <li key={article.id} className="flex gap-3 group">
                        <span className="text-3xl font-black text-gray-800 group-hover:text-green-600 transition-colors font-mono">0{idx + 1}</span>
                        <Link href={`/artikel/${article.slug}`} className="flex flex-col">
                        <span className="text-sm font-medium text-gray-300 group-hover:text-green-400 leading-snug line-clamp-2">
                            {article.title}
                        </span>
                        <span className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                            <Eye size={12} /> {(viewCounts[article.slug] || 0) + (article.score ? 120 : 45)} views
                        </span>
                        </Link>
                    </li>
                    ))
                ) : (
                    <li className="text-gray-500 italic text-sm">Nog geen populaire artikelen.</li>
                )}
              </ul>
            </div>

            {/* Featured Review (Dynamisch) - Verbeterd Design */}
            {featuredReview && (
              <Link href={`/artikel/${featuredReview.slug}`} className="block group">
                <div className="bg-gradient-to-br from-slate-900 via-green-900/30 to-slate-900 rounded-2xl border-2 border-green-500/40 p-6 text-center shadow-2xl relative overflow-hidden cursor-pointer hover:border-green-500/70 hover:shadow-green-900/30 transition-all duration-300 animate-float">
                  {/* Animated Background Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/30 transition-colors"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -ml-12 -mb-12"></div>
                  
                  {/* HIGH SCORE LABEL */}
                  {featuredReview.score && (() => { const lbl = getHighScoreLabel(featuredReview.category, featuredReview.score); return lbl ? (
                    <div className="absolute top-0 left-0 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-br-2xl shadow-lg z-20 border-r border-b border-purple-400/30">
                      {lbl.text}
                    </div>
                  ) : null; })()}

                  <div className="relative z-10">
                    {/* Header Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full mb-4">
                      <Star size={12} className="text-green-400" fill="currentColor" />
                      <span className="text-xs font-bold text-green-300 uppercase tracking-widest">Review Uitgelicht</span>
                    </div>
                    
                    {/* Scores - Editor & Community */}
                    {featuredReview.score && (
                      <div className="flex items-center justify-center gap-3 mb-4">
                        {/* Editor Score */}
                        <div className="relative">
                          <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-4 shadow-[0_0_30px_rgba(59,130,246,0.4)] group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all duration-300 ${
                            featuredReview.score >= 90 ? 'bg-gradient-to-br from-green-600 to-emerald-500 border-green-400' :
                            featuredReview.score >= 70 ? 'bg-gradient-to-br from-green-600 to-emerald-500 border-green-400' :
                            featuredReview.score >= 50 ? 'bg-gradient-to-br from-yellow-600 to-orange-500 border-yellow-400' :
                            'bg-gradient-to-br from-red-600 to-orange-600 border-red-400'
                          }`}>
                            <span className="text-3xl font-black text-white leading-none drop-shadow-lg">{featuredReview.score}</span>
                            <span className="text-[8px] text-white/90 font-bold uppercase tracking-wider mt-1">Editor</span>
                          </div>
                          <div className="absolute inset-0 rounded-2xl bg-green-500/20 blur-xl -z-10 group-hover:bg-green-500/30 transition-colors"></div>
                        </div>
                        
                        {/* Community Score */}
                        {featuredReviewRating && featuredReviewRating.count >= 10 ? (
                          <div className="relative">
                            <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-4 border-green-400/50 bg-gradient-to-br from-green-600 to-emerald-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all duration-300">
                              <User size={12} className="absolute -top-1 -right-1 text-green-200 bg-slate-900 rounded-full p-0.5" />
                              <span className="text-3xl font-black text-white leading-none drop-shadow-lg">{Math.round(featuredReviewRating.average)}</span>
                              <span className="text-[8px] text-white/90 font-bold uppercase tracking-wider mt-1">Community</span>
                            </div>
                            <div className="absolute inset-0 rounded-2xl bg-green-500/20 blur-xl -z-10 group-hover:bg-green-500/30 transition-colors"></div>
                          </div>
                        ) : featuredReviewRating && featuredReviewRating.count > 0 ? (
                          <div className="relative">
                            <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-4 border-slate-600/50 bg-slate-800/90 backdrop-blur-sm shadow-lg">
                              <Lock size={10} className="absolute -top-1 -right-1 text-slate-500 bg-slate-900 rounded-full p-0.5" />
                              <span className="text-lg font-black text-slate-400 leading-none">{featuredReviewRating.count}/10</span>
                              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">Locked</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    {/* Title & Excerpt */}
                    <h3 className="text-lg md:text-xl font-black text-white mb-2 leading-tight group-hover:text-green-300 transition-colors line-clamp-2">
                      {featuredReview.title}
                    </h3>
                    <p className="text-sm text-gray-300 mb-5 line-clamp-2 italic opacity-90 leading-relaxed">
                      "{featuredReview.excerpt}"
                    </p>
                    
                    {/* CTA Button */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <button className="relative w-full text-sm font-black bg-gradient-to-r from-green-600 to-emerald-500 text-white px-5 py-3 rounded-lg hover:from-green-500 hover:to-emerald-400 transition-all uppercase tracking-wider shadow-lg border border-white/20">
                        Lees Review &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            )}

          </aside>

        </div>

        {/* --- HIGHLIGHTED REPEAT SECTION --- */}
        {heroArticles.length > 0 && (
            <section className="mt-20 border-t border-gray-800 pt-12">
                <h2 className="text-xl md:text-2xl font-black text-white mb-8 uppercase italic tracking-tighter flex items-center gap-3">
                    <Flame className="text-red-500" />
                    GEMIST? UITGELICHTE TOPPERS
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {heroArticles.map((item) => (
                        <Link key={item.id} href={`/artikel/${item.slug}`} className="group block bg-[#111827] rounded-xl overflow-hidden border border-gray-800 hover:border-green-500/50 transition-all shadow-lg hover:shadow-green-900/10">
                            <div className="h-48 overflow-hidden relative">
                                {item.imageUrl && (
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                  />
                                )}
                                {item.score && (
                                    <div className="absolute top-2 right-2 bg-green-600 text-white font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                                        {item.score}
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <span className={`text-[10px] uppercase font-bold tracking-widest ${getCategoryColor(item.category).text} mb-2 block`}>
                                    {item.category}
                                </span>
                                <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors line-clamp-2 leading-tight">
                                    {item.title}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        )}

      </main>

      <AdminNewArticle />
    </div>
  );
}
