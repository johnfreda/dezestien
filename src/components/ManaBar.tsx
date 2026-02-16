'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ManaBar() {
  const { data: session } = useSession()
  const [mana, setMana] = useState<number | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetch('/api/profile')
        .then((r) => r.json())
        .then((data) => setMana(data.mana ?? 0))
        .catch(() => {})
    }
  }, [session])

  if (!session?.user || mana === null) return null

  return (
    <Link
      href="/mana"
      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm hover:bg-green-500/20 transition"
    >
      <span>✨</span>
      <span className="font-semibold">{mana}</span>
    </Link>
  )
}
