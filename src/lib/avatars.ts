import {
  User, Gamepad2, Swords, Shield, Target, Ghost,
  Flame, Zap, Skull, Bot, Crown, Star, Gem, Sparkles,
  type LucideIcon,
} from 'lucide-react'

export interface AvatarDef {
  id: string
  label: string
  icon: LucideIcon
  bg: string      // gradient background
  ring: string    // ring/border color
  manaRequired: number
}

export const avatars: AvatarDef[] = [
  // Gratis avatars
  { id: 'default',    label: 'Standaard',   icon: User,     bg: 'from-gray-600 to-gray-500',     ring: 'ring-gray-500',    manaRequired: 0 },
  { id: 'controller', label: 'Voetbalfan',       icon: Gamepad2, bg: 'from-green-600 to-emerald-500',     ring: 'ring-green-500',    manaRequired: 0 },
  { id: 'swords',     label: 'Strijder',    icon: Swords,   bg: 'from-red-600 to-orange-500',    ring: 'ring-red-500',     manaRequired: 0 },
  { id: 'shield',     label: 'Verdediger',  icon: Shield,   bg: 'from-slate-600 to-slate-400',   ring: 'ring-slate-400',   manaRequired: 0 },
  { id: 'target',     label: 'Scherpschutter', icon: Target, bg: 'from-rose-600 to-pink-500',    ring: 'ring-rose-500',    manaRequired: 0 },
  { id: 'ghost',      label: 'Spook',       icon: Ghost,    bg: 'from-violet-600 to-purple-400', ring: 'ring-violet-500',  manaRequired: 0 },

  // Voetbalfan level (100+ mana)
  { id: 'flame',      label: 'Vuurdemon',   icon: Flame,    bg: 'from-orange-500 to-red-600',    ring: 'ring-orange-500',  manaRequired: 100 },
  { id: 'lightning',  label: 'Bliksem',     icon: Zap,      bg: 'from-yellow-400 to-amber-600',  ring: 'ring-yellow-500',  manaRequired: 100 },

  // Pro level (500+ mana)
  { id: 'skull',      label: 'Schedelridder', icon: Skull,  bg: 'from-gray-400 to-gray-600',     ring: 'ring-gray-300',    manaRequired: 500 },
  { id: 'robot',      label: 'Mech',        icon: Bot,      bg: 'from-emerald-500 to-green-600',     ring: 'ring-emerald-400',    manaRequired: 500 },

  // Elite level (1000+ mana)
  { id: 'crown',      label: 'Koning',      icon: Crown,    bg: 'from-amber-400 to-yellow-600',  ring: 'ring-amber-400',   manaRequired: 1000 },
  { id: 'star',       label: 'Supernova',   icon: Star,     bg: 'from-amber-500 to-orange-500',  ring: 'ring-amber-500',   manaRequired: 1000 },

  // Legende level (2500+ mana)
  { id: 'gem',        label: 'Diamant',     icon: Gem,      bg: 'from-emerald-400 to-teal-600',  ring: 'ring-emerald-400', manaRequired: 2500 },
  { id: 'legendary',  label: 'Legende',     icon: Sparkles, bg: 'from-purple-500 to-pink-500',   ring: 'ring-purple-400',  manaRequired: 2500 },
]

export function getAvatar(id: string | null | undefined): AvatarDef {
  return avatars.find((a) => a.id === id) || avatars[0]
}
