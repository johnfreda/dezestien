export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Football (soccer ball) */}
      <circle cx="22" cy="22" r="20" fill="currentColor" className="text-green-500" />
      <circle cx="22" cy="22" r="20" stroke="currentColor" strokeWidth="1.5" className="text-green-600" />
      
      {/* Pentagon pattern */}
      <path d="M22 6l4.5 3.3-1.7 5.2h-5.6l-1.7-5.2L22 6z" fill="currentColor" className="text-green-700" />
      <path d="M33.5 15.5l-1 5.3-5 1.7-3.2-4 1.7-5.2 7.5 2.2z" fill="currentColor" className="text-green-700" />
      <path d="M10.5 15.5l7.5-2.2 1.7 5.2-3.2 4-5-1.7-1-5.3z" fill="currentColor" className="text-green-700" />
      <path d="M13 30l-2.5-5.5 5-1.7 3.2 4-.5 5.4L13 30z" fill="currentColor" className="text-green-700" />
      <path d="M31 30l-5.2 2.2-.5-5.4 3.2-4 5 1.7L31 30z" fill="currentColor" className="text-green-700" />
      
      {/* "16" text overlay */}
      <text x="22" y="28" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="white" style={{ letterSpacing: '-1px' }}>
        16
      </text>
    </svg>
  );
}
