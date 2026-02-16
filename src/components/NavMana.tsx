'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { User, Zap, Shield, Gamepad2, Crown, Star, ChevronRight } from 'lucide-react'
import { getAvatar } from '@/lib/avatars'

function getManaLevel(mana: number) {
  if (mana >= 2500) return { name: 'Legende', color: 'emerald', min: 2500, max: 5000, icon: Star }
  if (mana >= 1000) return { name: 'Elite', color: 'amber', min: 1000, max: 2500, icon: Crown }
  if (mana >= 500) return { name: 'Pro', color: 'purple', min: 500, max: 1000, icon: Zap }
  if (mana >= 100) return { name: 'Gamer', color: 'blue', min: 100, max: 500, icon: Gamepad2 }
  return { name: 'Rookie', color: 'gray', min: 0, max: 100, icon: Shield }
}

const colorMap: Record<string, { ring: string; badge: string; text: string; bar: string; glow: string }> = {
  gray:    { ring: '#6b7280', badge: 'bg-gray-600',    text: 'text-gray-400',    bar: 'from-gray-500 to-gray-400',       glow: '0 0 20px rgba(107,114,128,0.4)' },
  blue:    { ring: '#3b82f6', badge: 'bg-blue-600',    text: 'text-blue-400',    bar: 'from-blue-600 to-cyan-400',       glow: '0 0 20px rgba(59,130,246,0.5)' },
  purple:  { ring: '#a855f7', badge: 'bg-purple-600',  text: 'text-purple-400',  bar: 'from-purple-600 to-fuchsia-400',  glow: '0 0 20px rgba(168,85,247,0.5)' },
  amber:   { ring: '#f59e0b', badge: 'bg-amber-500',   text: 'text-amber-400',   bar: 'from-amber-500 to-yellow-400',   glow: '0 0 20px rgba(245,158,11,0.5)' },
  emerald: { ring: '#10b981', badge: 'bg-emerald-500', text: 'text-emerald-400', bar: 'from-emerald-500 to-teal-400',   glow: '0 0 20px rgba(16,185,129,0.5)' },
}

export default function NavMana() {
  const { data: session } = useSession()
  const [mana, setMana] = useState<number | null>(null)
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetch('/api/profile')
        .then((r) => r.json())
        .then((data) => { setMana(data.mana ?? 0); setAvatarId(data.image) })
        .catch(() => {})
    }
  }, [session])

  const handleMouseEnter = useCallback(() => {
    if (hideTimeout.current) { clearTimeout(hideTimeout.current); hideTimeout.current = null }
    setShowPopup(true)
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    hideTimeout.current = setTimeout(() => setShowPopup(false), 400)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (hideTimeout.current) clearTimeout(hideTimeout.current) }
  }, [])

  // Niet ingelogd: standaard avatar
  if (!session) {
    return (
      <Link
        href="/login"
        className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all border bg-gray-800 text-gray-400 hover:text-white border-gray-700 hover:border-gray-500 md:hidden"
        title="Inloggen"
      >
        <User size={16} />
      </Link>
    )
  }

  const level = getManaLevel(mana ?? 0)
  const colors = colorMap[level.color]
  const progress = mana !== null ? Math.min(100, ((mana - level.min) / (level.max - level.min)) * 100) : 0
  const LevelIcon = level.icon

  // SVG ring parameters
  const size = 40
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const av = getAvatar(avatarId)
  const AvatarIcon = av.icon

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar met progress ring */}
      <Link href="/profile" className="relative block" title="Mijn Profiel">
        {/* SVG Progress Ring */}
        <svg
          width={size}
          height={size}
          className="absolute -inset-[4px] md:-inset-[3.5px] transition-all duration-300"
          style={{
            transform: 'rotate(-90deg)',
            filter: isHovered ? `drop-shadow(${colors.glow})` : 'none',
          }}
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={strokeWidth}
            className="transition-all duration-300"
          />
          {/* Progress ring */}
          {mana !== null && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors.ring}
              strokeWidth={isHovered ? strokeWidth + 1 : strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500 ease-out"
            />
          )}
        </svg>

        {/* Avatar circle */}
        <div
          className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center bg-gradient-to-br ${av.bg} text-white border border-white/10 transition-all duration-300`}
          style={{
            boxShadow: isHovered ? colors.glow : 'none',
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          <AvatarIcon size={16} />
        </div>

        {/* Level badge */}
        {mana !== null && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${colors.badge} rounded-full flex items-center justify-center border-2 border-[#0f1522] transition-transform duration-300`}
            style={{ transform: isHovered ? 'scale(1.15)' : 'scale(1)' }}
          >
            <LevelIcon size={8} className="text-white" />
          </div>
        )}
      </Link>

{/* Mana count removed per user preference */}

      {/* Invisible bridge between avatar and popup */}
      {showPopup && (
        <div className="absolute top-full right-0 w-full h-5" />
      )}

      {/* Hover popup */}
      {showPopup && mana !== null && (
        <div className="absolute top-full right-0 mt-5 w-52 bg-[#111827] border border-gray-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Arrow */}
          <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#111827] border-l border-t border-gray-700 rotate-45" />

          {/* Level header */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 ${colors.badge} rounded-lg flex items-center justify-center`}>
              <LevelIcon size={14} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold ${colors.text}`}>{level.name}</p>
              <p className="text-[10px] text-gray-500">Level</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>{mana} Mana</span>
              <span>{level.max}</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${colors.bar} xp-bar`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Links */}
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-1">
            <Link
              href="/profile"
              className="flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors group py-1"
            >
              <span>Mijn Profiel</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/mana"
              className="flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors group py-1"
            >
              <span>Bekijk Mana</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
