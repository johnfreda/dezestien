'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function ManaReader({ slug: articleSlug }: { slug: string }) {
  const { data: session } = useSession()
  const [earned, setEarned] = useState(false)
  const [mana, setMana] = useState(0)

  useEffect(() => {
    if (!session?.user || !articleSlug) return

    // Wait 15 seconds before awarding mana (to ensure they actually read)
    const timer = setTimeout(() => {
      fetch('/api/mana/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleSlug }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.alreadyEarned && data.mana > 0) {
            setEarned(true)
            setMana(data.mana)
          }
        })
        .catch(() => {})
    }, 15000)

    return () => clearTimeout(timer)
  }, [session, articleSlug])

  if (!earned) return null

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-bounce bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      +{mana} Mana verdiend! ✨
    </div>
  )
}
