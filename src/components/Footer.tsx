import Link from 'next/link';
import { Send } from 'lucide-react';
import Logo from './Logo';

const categories = [
  { name: 'Eredivisie', slug: 'eredivisie' },
  { name: 'Champions League', slug: 'champions-league' },
  { name: 'Europa League', slug: 'europa-league' },
  { name: 'Transfers', slug: 'transfers' },
  { name: 'Oranje', slug: 'oranje' },
  { name: 'Buitenland', slug: 'buitenland' },
  { name: 'Eerste Divisie', slug: 'eerste-divisie' },
  { name: 'Vrouwenvoetbal', slug: 'vrouwenvoetbal' },
  { name: 'Analyse', slug: 'analyse' },
  { name: 'Opinie', slug: 'opinie' },
  { name: 'Geruchten', slug: 'geruchten' },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] mt-12">
      <div className="h-1 bg-gradient-to-r from-green-600 via-emerald-500 to-green-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Over DeZestien */}
          <div>
            <div className="text-2xl font-black tracking-tighter italic mb-4">
              <Logo className="w-7 h-7 inline-block mr-1.5 align-middle" /><span className="text-[var(--text-primary)]">DE</span><span className="text-green-500">ZESTIEN</span><span className="text-[var(--text-muted)]">.NL</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              DeZestien.nl is jouw dagelijkse bron voor Nederlands voetbalnieuws.
              Eredivisie, transfers, Champions League, Oranje en meer.
              Scherpe analyse, geen ruis. Door voetballiefhebbers, voor voetballiefhebbers.
            </p>
            <Link
              href="/tip-de-redactie"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-semibold transition-colors"
            >
              <Send size={14} />
              Tip de redactie
            </Link>
          </div>

          {/* Categorieën */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest mb-4">Categorieën</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categorie/${cat.slug}`}
                    className="text-[var(--text-muted)] hover:text-green-400 text-sm transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest mb-4">Navigatie</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-[var(--text-muted)] hover:text-green-400 text-sm transition-colors">Home</Link></li>
              <li><Link href="/forum" className="text-[var(--text-muted)] hover:text-green-400 text-sm transition-colors">Forum</Link></li>
              <li><Link href="/categorie/eredivisie" className="text-[var(--text-muted)] hover:text-green-400 text-sm transition-colors">Eredivisie</Link></li>
              <li><Link href="/categorie/transfers" className="text-[var(--text-muted)] hover:text-green-400 text-sm transition-colors">Transfers</Link></li>
              <li><Link href="/tip-de-redactie" className="text-[var(--text-muted)] hover:text-green-400 text-sm transition-colors">Tip de Redactie</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--border-primary)] mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[var(--text-muted)] text-xs">
            &copy; {new Date().getFullYear()} DeZestien.nl — Alle rechten voorbehouden.
          </p>
          <p className="text-gray-700 text-xs">
            Nederlands voetbalnieuws, transfers &amp; analyse
          </p>
        </div>
      </div>
    </footer>
  );
}
