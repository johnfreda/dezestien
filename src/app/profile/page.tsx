'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, MessagesSquare, Reply, Sparkles, LogOut, ChevronRight, Shield, Gamepad2, Zap, Crown, Star, Pencil, Lock, Check } from 'lucide-react'
import { avatars, getAvatar } from '@/lib/avatars'

function getManaLevel(mana: number) {
  if (mana >= 2500) return { name: 'Legende', color: 'emerald', min: 2500, max: 5000, icon: Star }
  if (mana >= 1000) return { name: 'Elite', color: 'amber', min: 1000, max: 2500, icon: Crown }
  if (mana >= 500) return { name: 'Pro', color: 'purple', min: 500, max: 1000, icon: Zap }
  if (mana >= 100) return { name: 'Gamer', color: 'blue', min: 100, max: 500, icon: Gamepad2 }
  return { name: 'Rookie', color: 'gray', min: 0, max: 100, icon: Shield }
}

const colorMap: Record<string, { ring: string; text: string; bg: string; glow: string }> = {
  gray: { ring: 'ring-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10', glow: '' },
  blue: { ring: 'ring-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'glow-blue' },
  purple: { ring: 'ring-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'glow-purple' },
  amber: { ring: 'ring-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'glow-amber' },
  emerald: { ring: 'ring-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'glow-emerald' },
}

function getManaLevelName(manaRequired: number) {
  if (manaRequired >= 2500) return 'Legende'
  if (manaRequired >= 1000) return 'Elite'
  if (manaRequired >= 500) return 'Pro'
  if (manaRequired >= 100) return 'Gamer'
  return 'Gratis'
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      fetch('/api/profile').then(r => r.json()).then((data) => {
        setProfile(data)
        setNameInput(data.name || '')
      })
    }
  }, [status, router])

  if (status === 'loading' || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const mana = profile.mana || 0
  const level = getManaLevel(mana)
  const colors = colorMap[level.color]
  const LevelIcon = level.icon
  const progress = Math.min(((mana - level.min) / (level.max - level.min)) * 100, 100)
  const memberSince = new Date(profile.createdAt).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long' })
  const currentAvatar = getAvatar(profile.image)
  const CurrentAvatarIcon = currentAvatar.icon

  const handleSaveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === profile.name) { setEditingName(false); return }
    setSavingName(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) {
      setProfile({ ...profile, name: trimmed })
    }
    setSavingName(false)
    setEditingName(false)
  }

  const handleSelectAvatar = async (avatarId: string) => {
    const av = avatars.find((a) => a.id === avatarId)
    if (!av || av.manaRequired > mana) return
    if (avatarId === profile.image) { setShowAvatarPicker(false); return }
    setSavingAvatar(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: avatarId }),
    })
    if (res.ok) {
      setProfile({ ...profile, image: avatarId })
    }
    setSavingAvatar(false)
    setShowAvatarPicker(false)
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Hero Card: Avatar + Info */}
        <div className={`glass rounded-2xl p-6 md:p-8 ${colors.glow}`}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative group shrink-0"
              title="Avatar aanpassen"
            >
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${currentAvatar.bg} ring-3 ${currentAvatar.ring} flex items-center justify-center transition-transform group-hover:scale-105`}>
                <CurrentAvatarIcon size={36} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={18} className="text-white" />
              </div>
            </button>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white font-bold text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                    autoFocus
                    maxLength={30}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold text-white truncate">{profile.name}</h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1 text-gray-500 hover:text-blue-400 transition-colors rounded-md hover:bg-blue-500/10 shrink-0"
                    title="Naam aanpassen"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
              <p className="text-gray-500 text-xs mt-1">Lid sinds {memberSince}</p>
            </div>

            {/* Level Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${colors.bg} border border-gray-700/50`}>
              <LevelIcon size={16} className={colors.text} />
              <span className={`text-sm font-bold ${colors.text}`}>{level.name}</span>
            </div>
          </div>

          {/* Avatar Picker */}
          {showAvatarPicker && (
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <h3 className="text-white font-bold text-sm mb-4">Kies je avatar</h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                {avatars.map((av) => {
                  const AvatarIcon = av.icon
                  const isLocked = av.manaRequired > mana
                  const isSelected = av.id === (profile.image || 'default')
                  return (
                    <button
                      key={av.id}
                      onClick={() => !isLocked && handleSelectAvatar(av.id)}
                      disabled={isLocked || savingAvatar}
                      className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-blue-500/15 ring-2 ring-blue-500'
                          : isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-800/60 cursor-pointer'
                      }`}
                      title={isLocked ? `Vereist ${av.manaRequired} mana (${getManaLevelName(av.manaRequired)})` : av.label}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${av.bg} flex items-center justify-center relative`}>
                        <AvatarIcon size={22} className="text-white" />
                        {isLocked && (
                          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                            <Lock size={14} className="text-gray-300" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0b0f19]">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 leading-tight text-center">{av.label}</span>
                      {isLocked && (
                        <span className="text-[9px] text-gray-600">{av.manaRequired}+</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mana XP Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" />
                <span className="text-white font-bold text-lg">{mana}</span>
                <span className="text-gray-400 text-sm">Mana</span>
              </div>
              <span className="text-gray-500 text-xs">
                {level.max > mana ? `${level.max - mana} tot ${level.name === 'Legende' ? 'max' : 'volgend level'}` : 'Max level!'}
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 xp-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-gray-600 text-xs">{level.min}</span>
              <span className="text-gray-600 text-xs">{level.max}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="glass rounded-xl p-4 text-center card-lift">
            <MessageSquare size={20} className="text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{profile._count?.comments || 0}</p>
            <p className="text-gray-400 text-xs mt-1">Reacties</p>
          </div>
          <div className="glass rounded-xl p-4 text-center card-lift">
            <MessagesSquare size={20} className="text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{profile._count?.forumTopics || 0}</p>
            <p className="text-gray-400 text-xs mt-1">Forum Topics</p>
          </div>
          <div className="glass rounded-xl p-4 text-center card-lift">
            <Reply size={20} className="text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{profile._count?.forumReplies || 0}</p>
            <p className="text-gray-400 text-xs mt-1">Forum Replies</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link
            href="/mana"
            className="glass rounded-xl p-4 flex items-center justify-between hover:border-blue-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Sparkles size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Mana Overzicht</p>
                <p className="text-gray-500 text-xs">Bekijk je geschiedenis en hoe je mana verdient</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-600 group-hover:text-blue-400 transition" />
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full glass rounded-xl p-4 flex items-center gap-3 hover:border-red-500/30 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <LogOut size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Uitloggen</p>
              <p className="text-gray-500 text-xs">Log uit bij DeZestien</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  )
}
