import type { GmStyle } from '@/data/franchises'
import { getPlayer } from '@/data/players'
import { PROMPT_BY_ID } from '@/data/prompts'
import { assignSlots, budgetLeft, currentPick, offerOf, rosterOf, slotsFor, type DraftState } from './draft'
import type { Difficulty } from './formats'
import { marginalPower } from './rating'
import { gaussian, type Rng } from './rng'
import type { Player } from './types'

const NOISE: Record<Difficulty, number> = { rookie: 3.4, pro: 1.6, allstar: 0.6, goat: 0 }
const PROMPT_WEIGHT: Record<Difficulty, number> = { rookie: 0.05, pro: 0.08, allstar: 0.1, goat: 0.12 }

export function styleBias(style: GmStyle | undefined, p: Player): number {
  switch (style) {
    case 'bigs':
      return p.pos[0] === 'C' ? 1.8 : p.pos[0] === 'PF' && p.ht >= 82 ? 1 : 0
    case 'guards':
      return p.pos[0] === 'PG' || p.pos[0] === 'SG' ? 1.6 : 0
    case 'defense':
      return (p.def - 70) / 10
    case 'shooters':
      return (p.attrs.sht - 74) / 9
    case 'oldschool':
      return p.to < 2005 ? 1.3 : p.active ? -1.2 : 0
    case 'modern':
      return p.from >= 2010 ? 1.3 : p.to < 1995 ? -1.2 : 0
    case 'flash':
      return ((p.tags.flashy ?? 0) + (p.tags.dunker ?? 0)) * 0.5
    default:
      return 0
  }
}

export interface CpuOptions {
  difficulty?: Difficulty
}

/** Chooses a player id for whoever is currently on the clock. */
export function cpuChoose(s: DraftState, rng: Rng, opts: CpuOptions = {}): string | null {
  const cur = currentPick(s)
  if (!cur) return null
  const difficulty = opts.difficulty ?? s.settings.difficulty
  const offer = offerOf(s)
  const options = offer.items.filter((i) => i.ok)
  if (options.length === 0) return offer.items[0]?.id ?? null

  const team = s.teams[cur.team]
  const roster = rosterOf(s, cur.team)
  const { format, rounds } = s.settings
  const slots = format === 'starting-five' ? slotsFor(rounds) : null
  const currentAssign = slots ? assignSlots(roster, slots) : null
  const filledPositions = currentAssign ? currentAssign.slice(0, 5).filter(Boolean).length : 0
  const prompt = format === 'ball-knowledge' ? PROMPT_BY_ID[s.rounds[cur.round].promptId as string] : null
  const left = format === 'cap' ? budgetLeft(s, cur.team) : 0
  const target = format === 'cap' ? left / Math.max(1, rounds - roster.length) : 0

  const scored = options.map((item) => {
    const p = getPlayer(item.id)
    let v = marginalPower(roster, p)
    if (prompt) v += PROMPT_WEIGHT[difficulty] * prompt.fit(p)
    if (slots) {
      const next = assignSlots([...roster, p], slots)
      const filledNext = next ? next.slice(0, 5).filter(Boolean).length : filledPositions
      v += 1.1 * (filledNext - filledPositions)
    }
    if (format === 'cap') v -= 0.22 * Math.max(0, p.price - target)
    v += styleBias(team.gm, p)
    v += gaussian(rng) * NOISE[difficulty]
    return { id: item.id, v }
  })
  scored.sort((a, b) => b.v - a.v)

  if (difficulty === 'rookie' && rng() < 0.14) {
    const pool = scored.slice(0, Math.min(8, scored.length))
    return pool[Math.floor(rng() * pool.length)].id
  }
  return scored[0].id
}
