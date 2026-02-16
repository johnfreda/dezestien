import Link from 'next/link';
import { Send } from 'lucide-react';

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
    <footer className="bg-[#071020] border-t border-gray-800 mt-12">
      <div className="h-1 bg-gradient-to-r from-green-600 via-emerald-500 to-green-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Over DeZestien */}
          <div>
            <div className="text-2xl font-black tracking-tighter italic mb-4">
              <span className="text-white">DE</span><span className="text-green-500">ZESTIEN</span><span className="text-gray-500">.NL</span>
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
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">Categorieën</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categorie/${cat.slug}`}
                    className="text-gray-500 hover:text-green-400 text-sm transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">Navigatie</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-500 hover:text-green-400 text-sm transition-colors">Home</Link></li>
              <li><Link href="/forum" className="text-gray-500 hover:text-green-400 text-sm transition-colors">Forum</Link></li>
              <li><Link href="/categorie/eredivisie" className="text-gray-500 hover:text-green-400 text-sm transition-colors">Eredivisie</Link></li>
              <li><Link href="/categorie/transfers" className="text-gray-500 hover:text-green-400 text-sm transition-colors">Transfers</Link></li>
              <li><Link href="/tip-de-redactie" className="text-gray-500 hover:text-green-400 text-sm transition-colors">Tip de Redactie</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">
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
