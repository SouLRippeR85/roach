export function RoachMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="32" cy="38" rx="11" ry="16" />
        <ellipse cx="32" cy="22" rx="8" ry="7" />
        <circle cx="32" cy="13" r="4.2" />
        <path d="M29 10 C 22 2, 16 4, 14 8" />
        <path d="M35 10 C 42 2, 48 4, 50 8" />
        <path d="M24 20 L 10 14" />
        <path d="M40 20 L 54 14" />
        <path d="M22 30 L 8 30" />
        <path d="M42 30 L 56 30" />
        <path d="M24 44 L 10 52" />
        <path d="M40 44 L 54 52" />
        <path d="M32 22 V 52" opacity="0.45" />
      </g>
    </svg>
  );
}

export function Drips() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-36 overflow-hidden"
      aria-hidden="true"
    >
      <span className="roach-drip roach-drip-1 absolute top-0 w-1 rounded-full bg-accent/70" />
      <span className="roach-drip roach-drip-2 absolute top-0 w-1 rounded-full bg-accent/55" />
      <span className="roach-drip roach-drip-3 absolute top-0 w-1 rounded-full bg-accent/80" />
      <span className="roach-drip roach-drip-4 absolute top-0 w-1 rounded-full bg-accent/45" />
    </div>
  );
}
