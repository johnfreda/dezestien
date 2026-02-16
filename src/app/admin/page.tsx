'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Newspaper, Zap, Users, RefreshCw, ExternalLink, Clock, CheckCircle, AlertTriangle, Loader2, Send, Youtube } from 'lucide-react'

type GenerateResult = {
  success?: boolean;
  slug?: string;
  title?: string;
  error?: string;
}

type ScanResult = {
  scanned?: number;
  found?: number;
  processed?: number;
  dailyCount?: number;
  dailyMax?: number;
  isWeekend?: boolean;
  slotMax?: number;
  skipped?: boolean;
  reason?: string;
  results?: Array<{ title: string; status: string; slug?: string; error?: string }>;
  error?: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'nieuws' | 'scanner' | 'users'>('nieuws')
  const router = useRouter()

  // Nieuws genereren state
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('Nieuws')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)

  // Scanner state
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [forceOverride, setForceOverride] = useState(false)
  const [forceCount, setForceCount] = useState(5)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      fetch('/api/admin/check').then(r => r.json()).then(data => {
        if (data.isAdmin) {
          setIsAdmin(true)
          fetch('/api/admin/users').then(r => r.json()).then(data => setUsers(data.users || []))
        } else {
          router.push('/')
        }
      })
    }
  }, [status, router])

  // Handmatig artikel genereren
  const handleGenerate = async () => {
    if (!topic.trim()) return
    setIsGenerating(true)
    setGenerateResult(null)

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), category, youtubeUrl: youtubeUrl.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setGenerateResult(data)
        setTopic('')
        setYoutubeUrl('')
      } else {
        setGenerateResult({ error: data.error || 'Genereren mislukt' })
      }
    } catch (err: any) {
      setGenerateResult({ error: err.message })
    } finally {
      setIsGenerating(false)
    }
  }

  // Handmatig scanner triggeren
  const handleScan = async () => {
    setIsScanning(true)
    setScanResult(null)

    try {
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceOverride, count: forceCount }),
      })
      const data = await res.json()
      setScanResult(data)
    } catch (err: any) {
      setScanResult({ error: err.message })
    } finally {
      setIsScanning(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">DeZestien.nl Redactie Tools</p>
          </div>
          <div className="text-sm text-gray-500">
            Ingelogd als <span className="text-blue-400">{session?.user?.name}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
          <button
            onClick={() => setActiveTab('nieuws')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
              activeTab === 'nieuws'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Newspaper size={16} /> Nieuws Maken
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
              activeTab === 'scanner'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Zap size={16} /> Scanner
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Users size={16} /> Gebruikers
          </button>
        </div>

        {/* TAB: Nieuws Maken */}
        {activeTab === 'nieuws' && (
          <div className="space-y-6">
            <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Newspaper size={20} className="text-blue-400" />
                Artikel Genereren
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Voer een onderwerp of nieuwsbron in en laat de AI er een volledig artikel van schrijven.
              </p>

              <div className="space-y-4">
                {/* Onderwerp invoer */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Onderwerp / Bron</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Bijv: 'Nintendo Direct februari 2026 - nieuwe Mario game aangekondigd' of plak een nieuwsbron tekst..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
                    rows={4}
                    disabled={isGenerating}
                  />
                </div>

                {/* Categorie selectie */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Categorie</label>
                  <div className="flex flex-wrap gap-2">
                    {['Nieuws', 'Review', 'Special', 'Tech', 'Hardware', 'Indie', 'Opinie', 'Gerucht'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        disabled={isGenerating}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                          category === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* YouTube URL (optioneel) */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                    <Youtube size={16} className="text-red-500" />
                    YouTube Video URL
                    <span className="text-gray-500 font-normal">(optioneel)</span>
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500 mt-1">Video wordt als embed in het artikel geplaatst</p>
                </div>

                {/* Genereer knop */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Artikel wordt geschreven...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Genereer Artikel
                    </>
                  )}
                </button>
              </div>

              {/* Resultaat */}
              {generateResult && (
                <div className={`mt-6 p-4 rounded-xl border ${
                  generateResult.error
                    ? 'bg-red-900/20 border-red-800 text-red-300'
                    : 'bg-green-900/20 border-green-800 text-green-300'
                }`}>
                  {generateResult.error ? (
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Fout bij genereren</p>
                        <p className="text-sm mt-1 opacity-80">{generateResult.error}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <CheckCircle size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Artikel gepubliceerd!</p>
                        <p className="text-sm mt-1 opacity-80">{generateResult.title}</p>
                        {generateResult.slug && (
                          <a
                            href={`/artikel/${generateResult.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-sm mt-2 text-green-400 hover:text-green-300 underline"
                          >
                            Bekijk artikel <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Scanner */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap size={20} className="text-yellow-400" />
                RSS Scanner
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Trigger de RSS scanner handmatig om nieuwe artikelen op te halen en te genereren.
                De scanner checkt het dagelijks budget en genereert alleen als er ruimte is.
              </p>

              {/* Force override toggle */}
              <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForceOverride(!forceOverride)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${forceOverride ? 'bg-orange-500' : 'bg-gray-600'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${forceOverride ? 'translate-x-5' : ''}`} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white">Limiet overschrijven</span>
                    <p className="text-xs text-gray-500">Negeert dagmax, nachtmodus en slot-budgetten</p>
                  </div>
                </label>

                {forceOverride && (
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Aantal artikelen: <span className="text-orange-400">{forceCount}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={forceCount}
                      onChange={(e) => setForceCount(parseInt(e.target.value, 10))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning}
                className={`flex items-center gap-2 ${forceOverride ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20' : 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/20'} disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg disabled:shadow-none`}
              >
                {isScanning ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Scanner draait{forceOverride ? ` (${forceCount} artikelen)` : ''}...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    {forceOverride ? `Force Scan (${forceCount} artikelen)` : 'Start Scanner'}
                  </>
                )}
              </button>

              {/* Scan resultaat */}
              {scanResult && (
                <div className="mt-6 space-y-4">
                  {scanResult.error ? (
                    <div className="p-4 rounded-xl border bg-red-900/20 border-red-800 text-red-300 flex items-start gap-3">
                      <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Scanner fout</p>
                        <p className="text-sm mt-1 opacity-80">{scanResult.error}</p>
                      </div>
                    </div>
                  ) : scanResult.skipped ? (
                    <div className="p-4 rounded-xl border bg-yellow-900/20 border-yellow-800 text-yellow-300 flex items-start gap-3">
                      <Clock size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Scanner overgeslagen</p>
                        <p className="text-sm mt-1 opacity-80">{scanResult.reason}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-800 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-white">{scanResult.scanned}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Feeds</p>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-white">{scanResult.found}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Gevonden</p>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-blue-400">{scanResult.processed}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Verwerkt</p>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-green-400">{scanResult.dailyCount}/{scanResult.dailyMax}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Dagbudget</p>
                        </div>
                      </div>

                      {/* Individuele resultaten */}
                      {scanResult.results && scanResult.results.length > 0 && (
                        <div className="bg-gray-800 rounded-xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-700">
                            <h3 className="text-sm font-bold text-gray-300">Gegenereerde artikelen</h3>
                          </div>
                          {scanResult.results.map((r, i) => (
                            <div key={i} className="px-4 py-3 border-b border-gray-700/50 last:border-0 flex items-center gap-3">
                              {r.status === 'ok' ? (
                                <CheckCircle size={16} className="text-green-400 shrink-0" />
                              ) : (
                                <AlertTriangle size={16} className="text-red-400 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-white truncate">{r.title}</p>
                                {r.slug && (
                                  <a href={`/artikel/${r.slug}`} target="_blank" className="text-xs text-blue-400 hover:text-blue-300">
                                    Bekijk →
                                  </a>
                                )}
                                {r.error && <p className="text-xs text-red-400 mt-0.5">{r.error}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Gebruikers */}
        {activeTab === 'users' && (
          <div className="bg-gray-900/80 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-purple-400" />
                Gebruikers ({users.length})
              </h2>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-gray-400 text-xs uppercase tracking-wider">Naam</th>
                  <th className="px-6 py-3 text-gray-400 text-xs uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-gray-400 text-xs uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-gray-400 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        user.role === 'ADMIN' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBanned ? (
                        <span className="text-xs font-bold text-red-400 bg-red-900/30 px-2 py-1 rounded-md">Gebanned</span>
                      ) : (
                        <span className="text-xs font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded-md">Actief</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
