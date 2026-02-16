'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, BookOpen, MessageSquare, MessagesSquare, ArrowLeft, Shield, Gamepad2, Zap, Crown, Star, AlertTriangle, RefreshCw, ThumbsUp } from 'lucide-react'

function getManaLevel(mana: number) {
  if (mana >= 2500) return { name: 'Legende', color: 'emerald', min: 2500, max: 5000, icon: Star }
  if (mana >= 1000) return { name: 'Elite', color: 'amber', min: 1000, max: 2500, icon: Crown }
  if (mana >= 500) return { name: 'Pro', color: 'purple', min: 500, max: 1000, icon: Zap }
  if (mana >= 100) return { name: 'Gamer', color: 'blue', min: 100, max: 500, icon: Gamepad2 }
  return { name: 'Rookie', color: 'gray', min: 0, max: 100, icon: Shield }
}

const colorMap: Record<string, { text: string; bg: string; bar: string; border: string }> = {
  gray: { text: 'text-gray-400', bg: 'bg-gray-500/10', bar: 'from-gray-500 to-gray-400', border: 'border-gray-500/50' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', bar: 'from-blue-600 to-cyan-400', border: 'border-blue-500/50' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', bar: 'from-purple-600 to-blue-400', border: 'border-purple-500/50' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', bar: 'from-amber-500 to-yellow-400', border: 'border-amber-500/50' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'from-emerald-500 to-cyan-400', border: 'border-emerald-500/50' },
}

const levels = [
  { name: 'Rookie', min: 0, color: 'gray' },
  { name: 'Gamer', min: 100, color: 'blue' },
  { name: 'Pro', min: 500, color: 'purple' },
  { name: 'Elite', min: 1000, color: 'amber' },
  { name: 'Legende', min: 2500, color: 'emerald' },
]

export default function ManaPage() {
  const { data: session, status } = useSession()
  const [history, setHistory] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadData = async () => {
    setError(null)
    setLoading(true)
    try {
      const [profileRes, historyRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/mana/history'),
      ])

      if (profileRes.status === 401 || historyRes.status === 401) {
        router.push('/login')
        return
      }

      if (!profileRes.ok) {
        throw new Error(`Profiel laden mislukt (${profileRes.status})`)
      }

      const profileData = await profileRes.json()
      if (profileData.error) {
        throw new Error(profileData.error)
      }
      setProfile(profileData)

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        if (Array.isArray(historyData)) {
          setHistory(historyData)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis bij het laden van je gegevens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') loadData()
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <AlertTriangle size={40} className="text-amber-400 mx-auto" />
          <h2 className="text-white text-lg font-bold">Kon gegevens niet laden</h2>
          <p className="text-gray-400 text-sm">{error || 'Er ging iets mis. Probeer het opnieuw.'}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={loadData}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
            >
              <RefreshCw size={16} />
              Probeer opnieuw
            </button>
            <Link href="/profile" className="text-gray-400 hover:text-white text-sm transition">
              Terug naar profiel
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const mana = profile.mana || 0
  const level = getManaLevel(mana)
  const colors = colorMap[level.color]
  const LevelIcon = level.icon
  const progress = Math.min(((mana - level.min) / (level.max - level.min)) * 100, 100)

  return (
    <div className="min-h-screen bg-[#0b0f19] px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back link */}
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition">
          <ArrowLeft size={16} />
          Terug naar profiel
        </Link>

        {/* Mana Overview Card */}
        <div className="glass rounded-2xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Mana Amount */}
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Sparkles size={28} className="text-blue-400" />
                <span className="text-5xl font-black text-white">{mana}</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Mana Punten</p>
            </div>

            {/* Level Badge */}
            <div className="sm:ml-auto flex items-center gap-2.5 px-5 py-3 rounded-full glass">
              <LevelIcon size={20} className={colors.text} />
              <span className={`font-bold ${colors.text}`}>{level.name}</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className={`text-sm font-medium ${colors.text}`}>{level.name}</span>
              <span className="text-gray-500 text-xs">
                {level.max > mana ? `${level.max - mana} mana tot volgend level` : 'Max level bereikt!'}
              </span>
            </div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-1000 xp-bar`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-gray-500">{level.min}</span>
              <span className="text-[11px] text-gray-500">{level.max}</span>
            </div>

            {/* Level milestones */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
              {levels.map((l) => {
                const isCurrent = l.name === level.name
                const isActive = mana >= l.min
                const lColors = colorMap[l.color]
                return (
                  <div
                    key={l.name}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                      isCurrent
                        ? `${lColors.bg} ${lColors.text} ${lColors.border}`
                        : isActive
                          ? `${lColors.bg} ${lColors.text} border-transparent opacity-70`
                          : 'bg-gray-800/30 text-gray-600 border-transparent'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className={isCurrent || isActive ? 'opacity-70' : 'opacity-60'}>{l.min}+</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* How to earn mana */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Hoe verdien je mana?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass rounded-xl p-4 card-lift">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                <BookOpen size={18} className="text-blue-400" />
              </div>
              <p className="text-white font-medium text-sm">Artikelen lezen</p>
              <p className="text-blue-400 font-bold text-lg mt-1">+5 mana</p>
              <p className="text-gray-500 text-xs mt-1">Per gelezen artikel (na 15 sec)</p>
            </div>
            <div className="glass rounded-xl p-4 card-lift">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                <MessageSquare size={18} className="text-purple-400" />
              </div>
              <p className="text-white font-medium text-sm">Reacties plaatsen</p>
              <p className="text-purple-400 font-bold text-lg mt-1">+10 mana</p>
              <p className="text-gray-500 text-xs mt-1">Per reactie op een artikel</p>
            </div>
            <div className="glass rounded-xl p-4 card-lift">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
                <MessagesSquare size={18} className="text-cyan-400" />
              </div>
              <p className="text-white font-medium text-sm">Forum bijdragen</p>
              <p className="text-cyan-400 font-bold text-lg mt-1">+10 mana</p>
              <p className="text-gray-500 text-xs mt-1">Per topic of reply</p>
            </div>
            <div className="glass rounded-xl p-4 card-lift">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                <ThumbsUp size={18} className="text-amber-400" />
              </div>
              <p className="text-white font-medium text-sm">Reviews beoordelen</p>
              <p className="text-amber-400 font-bold text-lg mt-1">+10 mana</p>
              <p className="text-gray-500 text-xs mt-1">Geef je community score bij een review</p>
            </div>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Geschiedenis</h2>
          {history.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <Sparkles size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nog geen mana verdiend</p>
              <p className="text-gray-500 text-sm mt-1">Lees artikelen om je eerste mana te verdienen!</p>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden divide-y divide-gray-800/50">
              {history.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition">
                  <div>
                    <p className="text-white text-sm">{log.reason}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="text-blue-400 font-bold text-sm bg-blue-500/10 px-3 py-1 rounded-full">
                    +{log.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
