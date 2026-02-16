import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forum',
  description: 'Discussieer over games, nieuws en tech met de DeZestien community. Deel je mening en verdien Mana.',
  alternates: {
    canonical: 'https://www.dezestien.nl/forum',
  },
  openGraph: {
    title: 'Forum - DeZestien.nl',
    description: 'Discussieer over games, nieuws en tech met de DeZestien community.',
    url: 'https://www.dezestien.nl/forum',
    siteName: 'DeZestien.nl',
    type: 'website',
  },
}

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
