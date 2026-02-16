'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-card-hover)]"
      aria-label={theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
      title={theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-yellow-400" />
      ) : (
        <Moon size={18} className="text-[var(--text-secondary)]" />
      )}
    </button>
  );
}
