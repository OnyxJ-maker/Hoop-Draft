import { PLAYERS } from '@/data/players'
import { PROMPTS, type Prompt } from '@/data/prompts'
import { shuffle, weightedSample, type Rng } from './rng'
import type { Player } from './types'

export type PoolId = 'all' | 'modern' | 'classic' | 'active' | 'role' | 'stars'

export interface PoolDef {
  id: PoolId
  label: string
  blurb: string
  icon: string
  test: (p: Player) => boolean
}

export const POOLS: PoolDef[] = [
  { id: 'all', label: 'All-Time', blurb: 'Every legend, every era.', icon: 'Infinity', test: () => true },
  {
    id: 'modern',
    label: 'Modern Era',
    blurb: 'Primes from 2000 on.',
    icon: 'Zap',
    test: (p) => p.decades.some((d) => d >= 2000),
  },
  {
    id: 'classic',
    label: 'Classic Era',
    blurb: 'Primes before 2000.',
    icon: 'History',
    test: (p) => Math.max(...p.decades) < 2000,
  },
  { id: 'active', label: 'Active Players', blurb: 'Played in 2024-25.', icon: 'Flame', test: (p) => p.active },
  {
    id: 'role',
    label: 'No Superstars',
    blurb: 'Everyone 86 OVR or lower.',
    icon: 'Shield',
    test: (p) => p.ovr <= 86,
  },
  { id: 'stars', label: 'Stars Only', blurb: 'Everyone 86 OVR or higher.', icon: 'Crown', test: (p) => p.ovr >= 86 },
]

export const POOL_BY_ID: Record<PoolId, PoolDef> = Object.fromEntries(POOLS.map((p) => [p.id, p])) as Record<PoolId, PoolDef>

const poolCache = new Map<PoolId, Player[]>()

export function poolPlayers(id: PoolId): Player[] {
  let cached = poolCache.get(id)
  if (!cached) {
    cached = PLAYERS.filter(POOL_BY_ID[id].test)
    poolCache.set(id, cached)
  }
  return cached
}

const group = (p: Player) => (p.pos[0] === 'PG' || p.pos[0] === 'SG' ? 'G' : p.pos[0] === 'SF' ? 'W' : 'B')

export function dealPack(rng: Rng, candidates: readonly Player[], size: number, temp = 22): string[] {
  let best: Player[] = []
  for (let attempt = 0; attempt < 8; attempt++) {
    const pack = weightedSample(rng, candidates, (p) => Math.exp((p.ovr - 80) / temp), size)
    best = pack
    const groups = new Set(pack.map(group))
    if (size < 4 || groups.size >= 2) break
  }
  return best.map((p) => p.id)
}

export function dealPromptPool(rng: Rng, prompt: Prompt, candidates: readonly Player[], size: number): string[] {
  const ranked = [...candidates].sort((a, b) => prompt.fit(b) - prompt.fit(a) || b.ovr - a.ovr)
  const topPool = ranked.slice(0, Math.max(size + 6, 24)).filter((p) => prompt.fit(p) >= 8)
  const strongCount = Math.min(topPool.length, Math.ceil(size * 0.5))
  const strong = weightedSample(rng, topPool, (p) => prompt.fit(p) + 12, strongCount)
  const taken = new Set(strong.map((p) => p.id))
  const rest = candidates.filter((p) => !taken.has(p.id))
  const filler = weightedSample(rng, rest, (p) => Math.exp((p.ovr - 78) / 14), size - strong.length)
  return shuffle(rng, [...strong, ...filler]).map((p) => p.id)
}

export function planPrompts(rng: Rng, rounds: number): string[] {
  const vibes = shuffle(
    rng,
    PROMPTS.filter((p) => p.kind === 'vibes'),
  )
  const stats = shuffle(
    rng,
    PROMPTS.filter((p) => p.kind === 'stats'),
  )
  const vibeCount = Math.min(vibes.length, Math.ceil(rounds * 0.7))
  const chosen = [...vibes.slice(0, vibeCount), ...stats.slice(0, rounds - vibeCount)]
  return shuffle(rng, chosen)
    .slice(0, rounds)
    .map((p) => p.id)
}

export function planDecades(rng: Rng, rounds: number, candidates: readonly Player[], teams: number): number[] {
  const counts = new Map<number, number>()
  for (const p of candidates) for (const d of p.decades) counts.set(d, (counts.get(d) ?? 0) + 1)
  const tokens: number[] = []
  for (const [d, c] of counts.entries()) {
    if (d < 1960) continue
    const uses = Math.min(2, Math.floor((c - 5) / Math.max(1, teams)))
    for (let i = 0; i < uses; i++) tokens.push(d)
  }
  const fallback = [...counts.keys()].filter((d) => d >= 1960)
  const bag = shuffle(rng, tokens.length >= rounds ? tokens : [...tokens, ...shuffle(rng, fallback)])
  const out: number[] = []
  const seenInRow: number[] = []
  while (out.length < rounds && bag.length > 0) {
    let idx = bag.findIndex((d) => d !== seenInRow[seenInRow.length - 1])
    if (idx === -1) idx = 0
    const [d] = bag.splice(idx, 1)
    out.push(d)
    seenInRow.push(d)
  }
  while (out.length < rounds) out.push(fallback[out.length % Math.max(1, fallback.length)] ?? 1990)
  return out
}

export function decadeLabel(d: number): string {
  return `${d}s`
}
