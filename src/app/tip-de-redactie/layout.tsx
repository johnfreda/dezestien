import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tip de Redactie',
  description: 'Heb je interessant voetbalnieuws gezien? Stuur een tip naar de DeZestien redactie. Wij bekijken alle inzendingen.',
  alternates: {
    canonical: 'https://www.dezestien.nl/tip-de-redactie',
  },
  openGraph: {
    title: 'Tip de Redactie - DeZestien.nl',
    description: 'Stuur een nieuwstip naar de DeZestien redactie.',
    url: 'https://www.dezestien.nl/tip-de-redactie',
    siteName: 'DeZestien.nl',
    type: 'website',
  },
}

export default function TipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
