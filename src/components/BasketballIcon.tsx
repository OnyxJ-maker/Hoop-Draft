export function BasketballIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="currentColor" />
      <g fill="none" stroke="#1a0d05" strokeWidth="3.4" strokeLinecap="round">
        <path d="M3.5 50h93" />
        <path d="M50 3.5v93" />
        <path d="M15 17c22 15 22 51 0 66" />
        <path d="M85 17c-22 15-22 51 0 66" />
      </g>
      <circle cx="50" cy="50" r="47" fill="none" stroke="#1a0d05" strokeWidth="3.4" />
    </svg>
  )
}
