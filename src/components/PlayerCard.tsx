import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { Crown, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { heightLabel, type Player } from '@/engine/types'
import { BasketballIcon } from './BasketballIcon'
import { Icon } from './Icon'

export const CARD_W = 180
export const CARD_H = 262

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
const SCALE: Record<CardSize, number> = { xs: 0.52, sm: 0.72, md: 0.92, lg: 1.15, xl: 1.45 }

export function cardPixelSize(size: CardSize) {
  return { w: CARD_W * SCALE[size], h: CARD_H * SCALE[size] }
}

function statTone(v: number) {
  if (v >= 92) return 'text-lime-300'
  if (v >= 80) return 'text-white'
  if (v >= 62) return 'text-white/70'
  return 'text-white/40'
}

function initials(name: string) {
  const parts = name.replace(/[.]/g, '').split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? '?'
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.split(' ')
  if (parts.length === 1) return { first: '', last: name }
  const suffixes = ['Jr.', 'II', 'III', 'Sr.']
  let lastParts = 1
  if (suffixes.includes(parts[parts.length - 1]) && parts.length > 2) lastParts = 2
  return { first: parts.slice(0, parts.length - lastParts).join(' '), last: parts.slice(parts.length - lastParts).join(' ') }
}

function lastSize(last: string) {
  if (last.length > 17) return 14
  if (last.length > 13) return 16
  if (last.length > 10) return 19
  return 23
}

interface Props {
  player: Player
  size?: CardSize
  selected?: boolean
  disabled?: boolean
  faceDown?: boolean
  onClick?: () => void
  onDoubleClick?: () => void
  tag?: ReactNode
  footer?: ReactNode
  hideStats?: boolean
  className?: string
  tilt?: boolean
}

export function PlayerFace({
  player,
  hideStats,
  tag,
  footer,
  compact,
  dim,
}: Pick<Props, 'player' | 'hideStats' | 'tag' | 'footer'> & { compact?: boolean; dim?: boolean }) {
  const { first, last } = splitName(player.name)
  const a = player.attrs
  const stats: Array<[string, number]> = [
    ['SHT', a.sht],
    ['FIN', a.fin],
    ['HND', a.hnd],
    ['PAS', a.pas],
    ['REB', a.reb],
    ['DEF', Math.max(a.prd, a.ind)],
  ]
  const foil = player.tier === 'amethyst' || player.tier === 'galaxy' || player.tier === 'diamond'
  return (
    <div className={cn('pcard-inner', foil && 'pcard-foil')}>
      <div className="pcard-pattern" />
      <BasketballIcon className="pcard-ball text-white" size={150} />
      {dim && <div className="absolute inset-0 z-[5] bg-black/60" />}
      <div className="relative z-10 flex h-full flex-col px-2.5 pb-2 pt-1.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="pcard-mono text-[46px] leading-[0.95]">{player.ovr}</div>
            <div className="font-cond text-[12.5px] font-bold uppercase leading-none tracking-[0.14em] text-white/85">
              {player.pos.join('/')}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className="grid size-[28px] place-items-center rounded-full border border-white/25 bg-black/35"
              title={player.archetype.label}
            >
              <Icon name={player.archetype.icon} className="size-[15px] text-white" />
            </div>
            {tag}
          </div>
        </div>

        <div className={cn('pcard-mono -mt-1 text-center text-[78px] leading-[0.85] tracking-tight', compact && 'text-[64px]')}>
          {initials(player.name)}
        </div>

        <div className="mt-1.5 min-h-[50px] text-center">
          {first && <div className="font-cond text-[11px] font-semibold uppercase leading-none tracking-[0.18em] text-white/65">{first}</div>}
          <div
            className="font-display uppercase leading-[1.02] text-white"
            style={{ fontSize: lastSize(last), textShadow: '0 2px 12px rgb(0 0 0 / 0.55)' }}
          >
            {last}
          </div>
          {player.nick && (
            <div className="mt-px truncate font-cond text-[11px] font-medium italic leading-tight text-white/60">“{player.nick}”</div>
          )}
        </div>

        <div className="mt-1 flex items-center justify-center gap-2 font-cond text-[11px] font-semibold uppercase tracking-wider text-white/65">
          <span>
            {player.from}–{String(player.to).slice(-2)}
          </span>
          <span className="text-white/30">•</span>
          <span>{heightLabel(player.ht)}</span>
          {player.rings > 0 && (
            <span className="flex items-center gap-0.5 text-amber-300">
              <Trophy className="size-2.5" />
              {player.rings}
            </span>
          )}
          {player.mvps > 0 && (
            <span className="flex items-center gap-0.5 text-fuchsia-300">
              <Crown className="size-2.5" />
              {player.mvps}
            </span>
          )}
        </div>

        {!hideStats && (
          <div className="relative mt-auto grid grid-cols-3 gap-[3px] pt-1.5">
            {stats.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-center gap-1 rounded-[5px] bg-white/[0.07] py-[2px]">
                <span className="font-cond text-[9px] font-bold tracking-wider text-white/45">{k}</span>
                <span className={cn('font-display text-[13px] leading-none', statTone(v))}>{v}</span>
              </div>
            ))}
            {footer && (
              <div className="absolute inset-x-0 bottom-0 top-1.5 z-20 flex items-center justify-center rounded-[6px] bg-black/80 backdrop-blur-sm">
                {footer}
              </div>
            )}
          </div>
        )}
        {hideStats && footer && <div className="mt-auto">{footer}</div>}
      </div>
    </div>
  )
}

export function CardBack() {
  return (
    <div className="pcard-inner grid place-items-center bg-[#0b0a1a]">
      <div className="pcard-pattern" />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <BasketballIcon size={64} className="text-primary" />
        <div className="font-display text-[26px] leading-[0.9] tracking-wide text-white">
          HOOP
          <br />
          DRAFT
        </div>
        <div className="font-cond text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Ball knowledge</div>
      </div>
    </div>
  )
}

export function PlayerCard({
  player,
  size = 'md',
  selected,
  disabled,
  faceDown,
  onClick,
  onDoubleClick,
  tag,
  footer,
  hideStats,
  className,
  tilt = true,
}: Props) {
  const scale = SCALE[size]
  const clickable = !!onClick && !disabled
  const wrapperStyle: CSSProperties = { width: CARD_W * scale, height: CARD_H * scale, perspective: 1100 }
  return (
    <motion.div
      className={cn('relative shrink-0 select-none', clickable && 'cursor-pointer', className)}
      style={wrapperStyle}
      whileHover={clickable && tilt ? { y: -8, scale: 1.03 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      onClick={clickable ? onClick : undefined}
      onDoubleClick={clickable ? onDoubleClick : undefined}
      role={clickable ? 'button' : undefined}
      aria-pressed={clickable ? !!selected : undefined}
      aria-label={clickable ? `${player.name}, ${player.ovr} overall` : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      <div
        style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className={cn(disabled && !footer && 'opacity-40 grayscale')}
      >
        <div
          className="relative size-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transform: faceDown ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div className={cn('pcard-front pcard', `tier-${player.tier}`, selected && 'is-selected')}>
            <PlayerFace
              player={player}
              tag={tag}
              footer={footer}
              hideStats={hideStats || size === 'xs'}
              compact={size === 'xs'}
              dim={disabled && !!footer}
            />
          </div>
          <div className={cn('pcard-back pcard', 'tier-silver')}>
            <CardBack />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
