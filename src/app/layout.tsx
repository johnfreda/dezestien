import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { Providers } from "@/components/Providers";
import { Toaster } from 'react-hot-toast';
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a1628",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.dezestien.nl'),
  title: {
    template: "%s | DeZestien.nl",
    default: "DeZestien.nl - Nederlands Voetbalnieuws, Transfers & Analyse",
  },
  description: "Jouw dagelijkse bron voor Nederlands voetbalnieuws. Eredivisie, transfers, Champions League, Oranje en meer. Scherpe analyse, geen ruis.",
  keywords: ["voetbal nieuws", "eredivisie", "transfers", "champions league", "ajax", "psv", "feyenoord", "oranje", "knvb", "voetbal nederland"],
  authors: [{ name: "DeZestien Redactie" }],
  creator: "DeZestien.nl",
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "https://www.dezestien.nl",
    siteName: "DeZestien.nl",
    images: [
      {
        url: "https://www.dezestien.nl/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DeZestien.nl - Nederlands Voetbalnieuws, Transfers & Analyse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dezestien",
    creator: "@dezestien",
  },
  alternates: {
    languages: {
      'nl-NL': 'https://www.dezestien.nl',
      'x-default': 'https://www.dezestien.nl',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Haal navigatie op uit Sanity
  const query = groq`*[_type == "navigation"][0].items`;
  const navItems = await client.fetch(query).catch(() => null);

  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
      </head>
      <body
        className={`${inter.variable} ${oswald.variable} antialiased font-sans`}
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <Providers>
          <Navbar items={navItems} />
          {children}
          <Footer />
          <BackToTop />
          <Toaster position="bottom-center" />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
