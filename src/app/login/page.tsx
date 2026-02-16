'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Ongeldige inloggegevens')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-tighter text-white italic inline-block">
            DE<span className="text-green-500 logo-glow">ZESTIEN</span>
            <span className="not-italic text-xs text-[var(--text-muted)] font-normal ml-1">.NL</span>
          </Link>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-green-900/10">
          <h1 className="text-2xl font-bold text-white mb-1 text-center">Welkom terug</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Log in om verder te gaan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Wachtwoord"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold transition-all disabled:opacity-50 press-effect flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Inloggen
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border-primary)]/50 text-center">
            <p className="text-[var(--text-muted)] text-sm">
              Nog geen account?{' '}
              <Link href="/register" className="text-green-400 hover:text-green-300 font-medium transition">
                Registreer hier
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
