'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Eye, EyeOff } from 'lucide-react'

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: '', width: '0%' }
  if (pw.length < 6) return { label: 'Te kort', color: 'bg-red-500', width: '20%' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Zwak', color: 'bg-orange-500', width: '40%' }
  if (score === 2) return { label: 'Redelijk', color: 'bg-yellow-500', width: '60%' }
  if (score === 3) return { label: 'Sterk', color: 'bg-green-500', width: '80%' }
  return { label: 'Zeer sterk', color: 'bg-emerald-500', width: '100%' }
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registratie mislukt')
        setLoading(false)
        return
      }

      router.push('/login')
    } catch {
      setError('Er ging iets mis')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-tighter text-white italic inline-block">
            DE<span className="text-green-500 logo-glow">ZESTIEN</span>
            <span className="not-italic text-xs text-[var(--text-muted)] font-normal ml-1">.NL</span>
          </Link>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-purple-900/10">
          <h1 className="text-2xl font-bold text-white mb-1 text-center">Account aanmaken</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Word lid van de community</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Naam</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 text-white border border-[var(--border-primary)]/50 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-[var(--text-muted)]"
                placeholder="Jouw gebruikersnaam"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 text-white border border-[var(--border-primary)]/50 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-[var(--text-muted)]"
                placeholder="jouw@email.nl"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Wachtwoord</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/80 text-white border border-[var(--border-primary)]/50 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-[var(--text-muted)] pr-12"
                  placeholder="Minimaal 6 tekens"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${
                    strength.color === 'bg-red-500' ? 'text-red-400' :
                    strength.color === 'bg-orange-500' ? 'text-orange-400' :
                    strength.color === 'bg-yellow-500' ? 'text-yellow-400' :
                    strength.color === 'bg-green-500' ? 'text-green-400' :
                    'text-emerald-400'
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-500 hover:to-green-400 text-white font-bold transition-all disabled:opacity-50 press-effect flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Account aanmaken
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border-primary)]/50 text-center">
            <p className="text-[var(--text-muted)] text-sm">
              Al een account?{' '}
              <Link href="/login" className="text-green-400 hover:text-green-300 font-medium transition">
                Log hier in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
