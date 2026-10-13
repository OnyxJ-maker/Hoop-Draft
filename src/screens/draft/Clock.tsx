import { cn } from '@/lib/utils'

export function ClockRing({ left, total, color, size = 54 }: { left: number; total: number; color: string; size?: number }) {
  const r = size / 2 - 5
  const c = 2 * Math.PI * r
  const frac = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0
  const urgent = left <= 5
  return (
    <div className={cn('relative grid place-items-center', urgent && 'anim-shake')} style={{ width: size, height: size }} aria-label={`${left} seconds left`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(255 255 255 / 0.12)" strokeWidth="5" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={urgent ? '#f87171' : color}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span className={cn('absolute font-display text-xl leading-none', urgent ? 'text-red-300' : 'text-white')}>{left}</span>
    </div>
  )
}

export function Dots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  )
}
