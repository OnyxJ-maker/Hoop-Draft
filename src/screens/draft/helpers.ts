import { useEffect, useRef, useState } from 'react'
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
  const stamp = `${resetKey}|${seconds}`
  const [clock, setClock] = useState({ stamp, left: seconds })
  const expiredRef = useRef(false)
  const cb = useRef(onExpire)

  useEffect(() => {
    cb.current = onExpire
  })

  if (clock.stamp !== stamp) {
    setClock({ stamp, left: seconds })
  }

  useEffect(() => {
    expiredRef.current = false
  }, [stamp])

  useEffect(() => {
    if (!active || seconds <= 0) return
    const id = setInterval(() => setClock((c) => (c.stamp === stamp ? { ...c, left: c.left - 1 } : c)), 1000)
    return () => clearInterval(id)
  }, [active, seconds, stamp])

  const left = clock.stamp === stamp ? clock.left : seconds

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
