'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { Check, X as XIcon, Pencil, Link2 } from 'lucide-react'

interface UserRatingProps {
  slug: string
  editorScore?: number
  pros?: string[]
  cons?: string[]
  gameTitle?: string
  boxImageUrl?: string | null
}

function getScoreColor(score: number) {
  if (score >= 90) return { stroke: '#10b981', glow: 'shadow-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
  if (score >= 70) return { stroke: '#3b82f6', glow: 'shadow-green-500/20', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' }
  if (score >= 50) return { stroke: '#f59e0b', glow: 'shadow-amber-500/20', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  return { stroke: '#ef4444', glow: 'shadow-red-500/20', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
}

export default function UserRating({ slug, editorScore, pros, cons, gameTitle, boxImageUrl }: UserRatingProps) {
  const { data: session } = useSession()
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [animated, setAnimated] = useState(false)
  const gaugeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/ratings?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setAverage(data.average || 0)
        setCount(data.count || 0)
        setUserRating(data.userRating)
        if (data.userRating) setInputValue(String(data.userRating))
      })
      .catch(() => {})
  }, [slug])

  // Animate gauge when scrolled into view
  useEffect(() => {
    if (!gaugeRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true) },
      { threshold: 0.3 }
    )
    observer.observe(gaugeRef.current)
    return () => observer.disconnect()
  }, [])

  const handleSubmit = async () => {
    if (!session?.user) return
    const rating = parseInt(inputValue, 10)
    if (isNaN(rating) || rating < 10 || rating > 100) return

    setSubmitting(true)

    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, rating }),
    })

    if (res.ok) {
      const data = await fetch(`/api/ratings?slug=${slug}&t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json())
      setAverage(data.average || 0)
      setCount(data.count || 0)
      setSubmitted(true)
      setSubmitting(false)
      // Show "Opgeslagen!" for 1.5s, then switch to compact view
      setTimeout(() => {
        setUserRating(rating)
        setEditing(false)
        setSubmitted(false)
      }, 1500)
    } else {
      setSubmitting(false)
    }
  }

  const validInput = (() => {
    const n = parseInt(inputValue, 10)
    return !isNaN(n) && n >= 10 && n <= 100
  })()

  const scoreColors = editorScore ? getScoreColor(editorScore) : null

  // SVG gauge parameters
  const gaugeSize = 120
  const strokeWidth = 6
  const radius = (gaugeSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = editorScore ? (editorScore / 100) : 0
  const offset = circumference - (animated ? progress : 0) * circumference

  return (
    <div ref={gaugeRef} className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-[var(--border-primary)]/50 mt-10 overflow-hidden">
      {/* Top section: Score gauge + box art */}
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Score Gauge */}
          {editorScore && scoreColors && (
            <div className="flex flex-col items-center shrink-0">
              <div className={`relative w-[120px] h-[120px] ${scoreColors.glow} shadow-2xl rounded-full`}>
                <svg width={gaugeSize} height={gaugeSize} className="transform -rotate-90">
                  {/* Background ring */}
                  <circle
                    cx={gaugeSize / 2}
                    cy={gaugeSize / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeWidth}
                  />
                  {/* Score ring */}
                  <circle
                    cx={gaugeSize / 2}
                    cy={gaugeSize / 2}
                    r={radius}
                    fill="none"
                    stroke={scoreColors.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </svg>
                {/* Score number in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`font-black text-3xl ${scoreColors.text}`}>{editorScore}</span>
                  <span className="text-[var(--text-muted)] text-[10px] font-medium -mt-1">/100</span>
                </div>
              </div>
              <span className="text-gray-400 text-xs font-semibold mt-2 uppercase tracking-wider">Redactie</span>
            </div>
          )}

          {/* Box art + info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            {/* Box art — shown on desktop next to info */}
            <div className="flex items-start gap-4">
              {boxImageUrl && (
                <div className="w-16 h-22 rounded-lg overflow-hidden shadow-lg border border-[var(--border-primary)]/50 shrink-0 hidden sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={boxImageUrl} alt="Box art" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                {gameTitle && (
                  <h3 className="text-white font-bold text-xl mb-4">{gameTitle}</h3>
                )}

                {/* Community score + rating — alleen voor ingelogde users */}
                {session?.user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                        <span className="text-green-400 font-bold text-2xl">{average > 0 ? average : '–'}</span>
                        <span className="text-[var(--text-muted)] text-xs ml-1">/100</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-[var(--text-primary)] font-medium">Community</p>
                        <p className="text-xs text-[var(--text-muted)]">{count} {count === 1 ? 'stem' : 'stemmen'}</p>
                      </div>
                    </div>

                    {/* Jouw score: compact display als al beoordeeld, invoerveld als nieuw/editing */}
                    {userRating && !editing ? (
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="text-xs text-[var(--text-muted)] font-medium shrink-0">Jouw score:</span>
                        <span className="text-white font-bold text-sm">{userRating}</span>
                        <button
                          onClick={() => setEditing(true)}
                          className="p-1 text-[var(--text-muted)] hover:text-green-400 transition-colors rounded-md hover:bg-green-500/10"
                          title="Score aanpassen"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="text-xs text-[var(--text-muted)] font-medium shrink-0">Jouw score:</span>
                          <input
                            type="number"
                            min={10}
                            max={100}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && validInput) handleSubmit() }}
                            placeholder="10-100"
                            className="w-20 bg-gray-800/80 border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-white text-center font-bold text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={handleSubmit}
                            disabled={!validInput || submitting}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                              submitted
                                ? 'bg-green-600 text-white'
                                : validInput
                                  ? 'bg-green-600 hover:bg-green-500 text-white'
                                  : 'bg-gray-800 text-[var(--text-muted)] cursor-not-allowed'
                            }`}
                          >
                            {submitting ? '...' : submitted ? 'Opgeslagen!' : 'Beoordeel'}
                          </button>
                          {userRating && editing && (
                            <button
                              onClick={() => { setEditing(false); setInputValue(String(userRating)) }}
                              className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10"
                              title="Annuleren"
                            >
                              <XIcon size={14} />
                            </button>
                          )}
                        </div>
                        {inputValue && !validInput && (
                          <p className="text-red-400 text-[10px]">Voer een cijfer in tussen 10 en 100</p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] text-sm">
                    <button
                      onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                      className="text-green-400 hover:text-green-300 font-semibold underline underline-offset-2 transition-colors"
                    >
                      Log in
                    </button>
                    {' '}om de community score te zien en je beoordeling te geven
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pros/Cons — bottom section */}
      {(pros?.length || cons?.length) ? (
        <div className="border-t border-[var(--border-primary)]/50 bg-gray-900/40 px-6 sm:px-8 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pros && pros.length > 0 && (
              <div>
                <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2.5">Pluspunten</h4>
                <div className="space-y-1.5">
                  {pros.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-[var(--text-primary)] text-sm leading-snug">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cons && cons.length > 0 && (
              <div>
                <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2.5">Minpunten</h4>
                <div className="space-y-1.5">
                  {cons.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                      <XIcon size={14} className="text-red-400 mt-0.5 shrink-0" />
                      <span className="text-[var(--text-primary)] text-sm leading-snug">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Share buttons */}
      <div className="border-t border-[var(--border-primary)]/50 px-6 sm:px-8 py-4 flex items-center gap-3">
        <span className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">Deel</span>
        <div className="flex items-center gap-2">
          {/* X (Twitter) */}
          <button
            onClick={() => {
              const url = encodeURIComponent(window.location.href)
              const text = encodeURIComponent(gameTitle
                ? `${gameTitle}${editorScore ? ` — ${editorScore}/100` : ''} op @dezestien`
                : 'Check deze review op @dezestien')
              window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,width=550,height=420')
            }}
            className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            title="Delen op X"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          </button>
          {/* WhatsApp */}
          <button
            onClick={() => {
              const url = encodeURIComponent(window.location.href)
              const text = encodeURIComponent(gameTitle
                ? `${gameTitle}${editorScore ? ` — ${editorScore}/100` : ''} op DeZestien.nl`
                : 'Check deze review op DeZestien.nl')
              window.open(`https://wa.me/?text=${text}%20${url}`, '_blank', 'noopener')
            }}
            className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            title="Delen via WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          </button>
          {/* Reddit */}
          <button
            onClick={() => {
              const url = encodeURIComponent(window.location.href)
              const title = encodeURIComponent(gameTitle
                ? `${gameTitle}${editorScore ? ` — ${editorScore}/100` : ''} | DeZestien.nl`
                : 'Review op DeZestien.nl')
              window.open(`https://www.reddit.com/submit?url=${url}&title=${title}`, '_blank', 'noopener,width=550,height=550')
            }}
            className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            title="Delen op Reddit"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
          </button>
          {/* Copy link */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              setLinkCopied(true)
              setTimeout(() => setLinkCopied(false), 2000)
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              linkCopied
                ? 'bg-green-600/20 text-green-400'
                : 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white'
            }`}
            title={linkCopied ? 'Gekopieerd!' : 'Link kopiëren'}
          >
            {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
