import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { sfx } from '@/audio/sfx'
import { TAG_KEYS, type Player, type TagKey } from '@/engine/types'

export const TAG_LABEL: Record<TagKey, string> = {
  cartoon: 'Cartoon Character',
  predator: 'Predator',
  unguardable: 'Unguardable',
  tough: 'Street Fighter',
  dunker: 'Poster Maker',
  clutch: 'Clutch Gene',
  trash: 'Trash Talker',
  ankles: 'Ankle Breaker',
  hair: 'Hair Icon',
  swag: 'Swagger',
  nickn: 'Legendary Nickname',
  fast: 'Speed Demon',
  jumper: 'Pretty Jumper',
  hustle: 'Glue Guy',
  flashy: 'Showtime',
  smooth: 'Smooth Operator',
  bully: 'Bully Ball',
  underrated: 'Underrated',
  analyst: 'TV Analyst',
  villain: 'Villain Energy',
  funny: 'Class Clown',
}

export function topTags(p: Player, max = 5): Array<{ key: TagKey; label: string; level: number }> {
  return TAG_KEYS.filter((k) => (p.tags[k] ?? 0) >= 2)
    .map((k) => ({ key: k, label: TAG_LABEL[k], level: p.tags[k] ?? 0 }))
    .sort((a, b) => b.level - a.level)
    .slice(0, max)
}

export function useShotClock(seconds: number, active: boolean, resetKey: string | number, onExpire: () => void) {
  const [left, setLeft] = useState(seconds)
  const expiredRef = useRef(false)
  const cb = useRef(onExpire)
  cb.current = onExpire

  useEffect(() => {
    setLeft(seconds)
    expiredRef.current = false
  }, [seconds, resetKey])

  useEffect(() => {
    if (!active || seconds <= 0) return
    const id = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(id)
  }, [active, seconds, resetKey])

  useEffect(() => {
    if (!active || seconds <= 0) return
    if (left <= 5 && left > 0) sfx.tick()
    if (left <= 0 && !expiredRef.current) {
      expiredRef.current = true
      sfx.buzzer()
      cb.current()
    }
  }, [left, active, seconds])

  return Math.max(0, left)
}

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
