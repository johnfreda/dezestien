import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mana',
  robots: { index: false, follow: false },
}

export default function ManaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
