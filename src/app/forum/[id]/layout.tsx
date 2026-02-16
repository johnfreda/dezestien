import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forum Topic',
  description: 'Bekijk en reageer op dit forum topic in de DeZestien community. Discussieer over games, hardware en tech.',
  openGraph: {
    title: 'Forum Topic - DeZestien.nl',
    description: 'Bekijk en reageer op dit forum topic in de DeZestien community.',
    siteName: 'DeZestien.nl',
    type: 'website',
  },
}

export default function TopicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
