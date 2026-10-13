import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TIER_LABEL } from '@/data/players'
import { ATTR_KEYS, ATTR_LABELS, type Attrs, type Player, type TierKey } from '@/engine/types'
import { BasketballIcon } from './BasketballIcon'
import { Icon } from './Icon'

export function OvrBadge({ player, className }: { player: Player; className?: string }) {
  return (
    <span
      className={cn(
        'tier-bg inline-grid h-7 min-w-9 place-items-center rounded-md px-1.5 font-display text-[17px] leading-none text-black',
        `tier-${player.tier}`,
        className,
      )}
      style={{ background: 'linear-gradient(145deg, var(--t1), var(--t2))', boxShadow: '0 0 12px -2px var(--tg)' }}
      title={TIER_LABEL[player.tier]}
    >
      {player.ovr}
    </span>
  )
}

export function TierDot({ tier }: { tier: TierKey }) {
  return (
    <span
      className={cn('inline-block size-2.5 rounded-full', `tier-${tier}`)}
      style={{ background: 'linear-gradient(145deg, var(--t1), var(--t2))', boxShadow: '0 0 8px var(--tg)' }}
    />
  )
}

export function TeamAvatar({
  icon,
  color,
  size = 36,
  className,
  ring,
}: {
  icon: string
  color: string
  size?: number
  className?: string
  ring?: boolean
}) {
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full text-black', ring && 'ring-2 ring-white/80', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, ${color}, color-mix(in oklab, ${color} 55%, #000))`,
        boxShadow: `0 0 ${size / 2.5}px -2px ${color}`,
      }}
    >
      <Icon name={icon} style={{ width: size * 0.52, height: size * 0.52 }} strokeWidth={2.4} />
    </span>
  )
}

export function Logo({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const cfg = { sm: { ball: 26, text: 'text-2xl' }, md: { ball: 44, text: 'text-5xl' }, lg: { ball: 78, text: 'text-7xl sm:text-8xl' } }[size]
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-primary" style={{ animation: size === 'lg' ? 'bounce-ball 1.6s ease-in-out infinite' : undefined }}>
        <BasketballIcon size={cfg.ball} />
      </span>
      <div className={cn('font-display uppercase leading-[0.86] tracking-wide', cfg.text)}>
        <span className="text-white">Hoop</span>{' '}
        <span className="bg-gradient-to-r from-primary via-neon-pink to-neon-violet bg-clip-text text-transparent">Draft</span>
      </div>
    </div>
  )
}

export function AttrBars({ attrs, compact }: { attrs: Attrs; compact?: boolean }) {
  return (
    <div className={cn('grid gap-x-4 gap-y-1.5', compact ? 'grid-cols-2' : 'grid-cols-1')}>
      {ATTR_KEYS.map((k) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-[86px] shrink-0 font-cond text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            {ATTR_LABELS[k]}
          </span>
          <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${attrs[k]}%`,
                background:
                  attrs[k] >= 90
                    ? 'linear-gradient(90deg, #a3e635, #22d3ee)'
                    : attrs[k] >= 75
                      ? 'linear-gradient(90deg, #fbbf24, #ff7a1a)'
                      : 'linear-gradient(90deg, #64748b, #94a3b8)',
              }}
            />
          </div>
          <span className="w-6 text-right font-display text-[13px] text-white">{attrs[k]}</span>
        </div>
      ))}
    </div>
  )
}

export function SectionTitle({ children, className, right }: { children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <div className={cn('mb-2 flex items-center justify-between', className)}>
      <h3 className="font-cond text-[13px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{children}</h3>
      {right}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-cond text-[11px] font-bold tracking-wider text-white/80">
      {children}
    </kbd>
  )
}

export function CourtBackdrop() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 -z-10 size-full opacity-[0.07]"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1200 800"
      aria-hidden="true"
    >
      <g fill="none" stroke="#fff" strokeWidth="3">
        <rect x="40" y="40" width="1120" height="720" rx="6" />
        <line x1="600" y1="40" x2="600" y2="760" />
        <circle cx="600" cy="400" r="96" />
        <circle cx="600" cy="400" r="22" />
        <rect x="40" y="248" width="230" height="304" />
        <rect x="930" y="248" width="230" height="304" />
        <path d="M270 300a100 100 0 0 1 0 200" />
        <path d="M930 300a100 100 0 0 0 0 200" />
        <path d="M40 130c260 0 300 150 300 270s-40 270-300 270" />
        <path d="M1160 130c-260 0-300 150-300 270s40 270 300 270" />
      </g>
    </svg>
  )
}
