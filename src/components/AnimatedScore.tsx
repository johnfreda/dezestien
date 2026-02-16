'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedScoreProps {
  score: number;
  size?: number;
  label?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400' };
  if (score >= 70) return { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', text: 'text-blue-400' };
  if (score >= 50) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' };
  return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: 'text-red-400' };
};

export default function AnimatedScore({ score, size = 80, label }: AnimatedScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const colors = getScoreColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = isVisible ? (score / 100) * circumference : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * score);

      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, score]);

  return (
    <div ref={ref} className="relative inline-flex flex-col items-center gap-1">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Glow achtergrond */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-50 transition-opacity duration-1000"
          style={{
            backgroundColor: isVisible ? colors.glow : 'transparent',
          }}
        />

        {/* SVG Ring */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 relative z-10"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth={4}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-[1200ms] ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${colors.glow})`,
            }}
          />
        </svg>

        {/* Score getal */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span
            className={`font-black ${colors.text} ${size >= 80 ? 'text-2xl' : 'text-lg'}`}
            style={{
              textShadow: isVisible ? `0 0 20px ${colors.glow}` : 'none',
              transition: 'text-shadow 0.5s ease',
            }}
          >
            {displayScore}
          </span>
        </div>
      </div>

      {/* Label */}
      {label && (
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
          {label}
        </span>
      )}
    </div>
  );
}
