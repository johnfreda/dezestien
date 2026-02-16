'use client';

import { useState, useEffect, useCallback } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const article = document.querySelector('article');
    if (!article) return;

    const elements = article.querySelectorAll('h2, h3');
    const items: TocItem[] = [];

    elements.forEach((el, index) => {
      const id = el.id || `heading-${index}`;
      if (!el.id) el.id = id;

      items.push({
        id,
        text: el.textContent || '',
        level: el.tagName === 'H2' ? 2 : 3,
      });
    });

    setHeadings(items);
  }, []);

  const handleScroll = useCallback(() => {
    const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean);

    for (let i = headingElements.length - 1; i >= 0; i--) {
      const el = headingElements[i];
      if (el && el.getBoundingClientRect().top <= 120) {
        setActiveId(headings[i].id);
        return;
      }
    }
    setActiveId('');
  }, [headings]);

  useEffect(() => {
    if (headings.length < 3) return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings, handleScroll]);

  if (headings.length < 3) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile: collapsible */}
      <div className="lg:hidden mb-8 bg-[#111827] rounded-xl border border-gray-800 overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-sm font-bold text-gray-300"
        >
          <span className="flex items-center gap-2">
            <List size={16} className="text-blue-400" />
            Inhoudsopgave ({headings.length})
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isOpen && (
          <nav className="px-4 pb-4">
            <ul className="space-y-1">
              {headings.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => scrollTo(h.id)}
                    className={`block w-full text-left text-sm py-1.5 transition-colors ${
                      h.level === 3 ? 'pl-4' : ''
                    } ${
                      activeId === h.id
                        ? 'text-blue-400 font-semibold'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Desktop: sticky sidebar - rendered via portal or absolute positioning */}
      <div className="hidden lg:block fixed top-32 right-8 xl:right-[calc((100vw-896px)/2-280px)] w-56 z-30">
        <div className="bg-[#111827]/90 backdrop-blur-sm rounded-xl border border-gray-800 p-4 max-h-[60vh] overflow-y-auto">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <List size={14} className="text-blue-400" />
            Inhoudsopgave
          </h4>
          <nav>
            <ul className="space-y-1">
              {headings.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => scrollTo(h.id)}
                    className={`block w-full text-left text-xs py-1 transition-colors leading-snug ${
                      h.level === 3 ? 'pl-3' : ''
                    } ${
                      activeId === h.id
                        ? 'text-blue-400 font-semibold border-l-2 border-blue-400 pl-2'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
