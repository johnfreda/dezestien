'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import NotificationCenter from './NotificationCenter';
import NavMana from './NavMana';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

type NavItem = {
  label: string;
  url: string;
};

const navLinks = [
  { label: 'Home', url: '/' },
  { label: 'Nieuws', url: '/categorie/nieuws' },
  { label: 'Eredivisie', url: '/categorie/eredivisie' },
  { label: 'Transfers', url: '/categorie/transfers' },
  { label: 'CL', url: '/categorie/champions-league' },
  { label: 'Oranje', url: '/categorie/oranje' },
  { label: 'Forum', url: '/forum' },
];

export default function Navbar({ items }: { items?: NavItem[] }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md gradient-border-bottom" style={{ background: 'var(--bg-nav)', boxShadow: 'var(--shadow-md)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Mobile Menu Button & Logo */}
          <div className="flex items-center gap-3 md:gap-8">
            
            {/* Mobile Hamburger */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
                aria-label="Menu openen"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tighter italic" onClick={closeMenu}>
              <Logo className="w-8 h-8 flex-shrink-0" />
              <span className="text-[var(--text-primary)]">DE</span><span className="text-green-500 logo-glow">ZESTIEN</span>
              <span className="not-italic text-xs text-[var(--text-muted)] font-normal">.NL</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:block">
                <div className="flex items-baseline space-x-1">
                {navLinks.map((item) => (
                    <Link key={item.url} href={item.url} className="relative px-3 py-2 rounded-md text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all uppercase tracking-wide group">
                    {item.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full group-hover:w-3/4 transition-all duration-300" />
                    </Link>
                ))}
                </div>
            </div>
          </div>

          {/* RIGHT: Icons & Auth */}
          <div className="flex items-center gap-2 md:gap-4">
            <button aria-label="Zoeken" className="p-1">
              <Search className="w-5 h-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer mr-2 md:mr-0" />
            </button>
            
            <ThemeToggle />
            
            {/* Notification Center (only when logged in) */}
            {session && <NotificationCenter />}
            
            {/* Desktop Auth Buttons */}
            {!session && (
                <div className="hidden md:flex items-center gap-3 border-r border-[var(--border-primary)] pr-4 mr-1">
                    <Link 
                        href="/login" 
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Inloggen
                    </Link>
                    <Link
                        href="/register"
                        className="border border-green-600/30 hover:border-green-500 text-green-500 hover:text-green-400 hover:bg-green-600/5 text-xs font-bold py-1.5 px-3 rounded uppercase tracking-wider transition-all press-effect"
                    >
                        Account Aanmaken
                    </Link>
                </div>
            )}

            {/* Profile Avatar */}
            <NavMana />
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN (Full Height) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] absolute top-16 left-0 w-full h-[calc(100vh-64px)] overflow-y-auto animate-in slide-in-from-left-2 z-40 shadow-2xl p-4">
            <div className="flex flex-col space-y-2">
                {navLinks.map((item, index) => (
                    <Link
                        key={item.url}
                        href={item.url}
                        onClick={closeMenu}
                        className="stagger-item block px-4 py-4 rounded-xl text-lg font-bold text-[var(--text-primary)] hover:text-white hover:bg-gray-800 transition-colors uppercase tracking-wide border border-[var(--border-primary)] hover:border-green-500/50"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {item.label}
                    </Link>
                ))}

                {!session && (
                    <div className="grid grid-cols-1 gap-4 pt-6 mt-6 border-t border-[var(--border-primary)]">
                        <Link 
                            href="/login" 
                            onClick={closeMenu}
                            className="flex items-center justify-center gap-2 bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 transition-colors text-base uppercase"
                        >
                            <LogIn size={20} /> Inloggen
                        </Link>
                        <Link 
                            href="/register" 
                            onClick={closeMenu}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-500 transition-colors text-base uppercase shadow-lg shadow-green-900/20"
                        >
                            <UserPlus size={20} /> Account Aanmaken
                        </Link>
                    </div>
                )}
            </div>
        </div>
      )}
    </nav>
  );
}
