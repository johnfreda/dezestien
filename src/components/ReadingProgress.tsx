'use client';

import { useState, useEffect } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector('article');
      if (!article) return;

      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      const start = articleTop - windowHeight / 2;
      const end = articleTop + articleHeight - windowHeight / 2;

      if (scrollY <= start) {
        setProgress(0);
      } else if (scrollY >= end) {
        setProgress(100);
      } else {
        setProgress(Math.round(((scrollY - start) / (end - start)) * 100));
      }
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[3px] z-50">
      <div
        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-[width] duration-150 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
