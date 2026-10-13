import type { GmStyle } from '@/data/franchises'
import { getPlayer } from '@/data/players'
import { PROMPT_BY_ID } from '@/data/prompts'
import { FORMATS, type Difficulty, type Finale, type FormatId } from './formats'
import { dealPack, dealPromptPool, planDecades, planPrompts, poolPlayers, type PoolId } from './pool'
import { rngFor, shuffle } from './rng'
import type { Player, Pos } from './types'

export interface TeamSetup {
  id: string
  name: string
  owner: string
  human: boolean
  color: string
  icon: string
  gm?: GmStyle
}

export interface DraftSettings {
  format: FormatId
  finale: Finale
  rounds: number
  pool: PoolId
  difficulty: Difficulty
  shotClock: number
  bestOf: 1 | 3 | 5 | 7
  seasonRepeats: number
  mulligans: number
  packSize: number
  cap: number
  seed: number
}

export interface DraftPick {
  overall: number
  round: number
  team: number
  playerId: string
  by: 'human' | 'cpu' | 'clock'
  fit?: number
  bestFit?: number
  cost?: number
}

export interface RoundInfo {
  promptId?: string
  decade?: number
  pool?: string[]
}

export type Phase = 'intro' | 'pick' | 'reveal' | 'done'

export interface DraftState {
  settings: DraftSettings
  teams: TeamSetup[]
  order: number[]
  picks: DraftPick[]
  rosters: string[][]
  taken: Record<string, true>
  eligible: string[]
  rounds: RoundInfo[]
  packs: Record<number, string[]>
  rerolls: Record<number, number>
  mulligans: number[]
  phase: Phase
}

export const MIN_PRICE = 2

export function slotsFor(rounds: number): string[] {
  return ['PG', 'SG', 'SF', 'PF', 'C', ...Array.from({ length: Math.max(0, rounds - 5) }, () => 'B')]
}

export function assignSlots(players: readonly Player[], slots: readonly string[]): Array<Player | null> | null {
  if (players.length > slots.length) return null
  const matchSlot: number[] = new Array(slots.length).fill(-1)
  const tryPlayer = (pi: number, seen: boolean[]): boolean => {
    for (let si = 0; si < slots.length; si++) {
      if (seen[si]) continue
      const slot = slots[si]
      if (slot !== 'B' && !players[pi].pos.includes(slot as Pos)) continue
      seen[si] = true
      if (matchSlot[si] === -1 || tryPlayer(matchSlot[si], seen)) {
        matchSlot[si] = pi
        return true
      }
    }
    return false
  }
  for (let pi = 0; pi < players.length; pi++) {
    if (!tryPlayer(pi, new Array<boolean>(slots.length).fill(false))) return null
  }
  return slots.map((_, si) => (matchSlot[si] === -1 ? null : players[matchSlot[si]]))
}

export function rosterOf(s: DraftState, team: number): Player[] {
  return s.rosters[team].map(getPlayer)
}

export function spentOf(s: DraftState, team: number): number {
  return s.rosters[team].reduce((sum, id) => sum + getPlayer(id).price, 0)
}

export function budgetLeft(s: DraftState, team: number): number {
  return s.settings.cap - spentOf(s, team)
}

export function totalPicks(s: DraftState): number {
  return s.order.length
}

export interface CurrentPick {
  overall: number
  round: number
  team: number
  pickInRound: number
}

export function currentPick(s: DraftState): CurrentPick | null {
  const overall = s.picks.length
  if (overall >= s.order.length) return null
  const T = s.teams.length
  return { overall, round: Math.floor(overall / T), team: s.order[overall], pickInRound: overall % T }
}

export function availablePlayers(s: DraftState): Player[] {
  return s.eligible.filter((id) => !s.taken[id]).map(getPlayer)
}

export function validateSetup(
  settings: Pick<DraftSettings, 'format' | 'rounds' | 'pool'>,
  teamCount: number,
): { ok: boolean; reason?: string } {
  const size = poolPlayers(settings.pool).length
  const need = teamCount * settings.rounds + (settings.format === 'ball-knowledge' ? 8 : settings.format === 'pack' ? 12 : 6)
  if (size < need) return { ok: false, reason: `Pool too small: ${size} players for ${teamCount * settings.rounds} picks.` }
  if (teamCount < 1) return { ok: false, reason: 'Need at least one team.' }
  return { ok: true }
}

export function createDraft(settings: DraftSettings, teams: TeamSetup[]): DraftState {
  const rng = rngFor('draft', settings.seed)
  const T = teams.length
  const firstRound = shuffle(
    rng,
    teams.map((_, i) => i),
  )
  const order: number[] = []
  for (let r = 0; r < settings.rounds; r++) order.push(...(r % 2 === 0 ? firstRound : [...firstRound].reverse()))

  const eligible = poolPlayers(settings.pool).map((p) => p.id)
  const eligiblePlayers = poolPlayers(settings.pool)
  const rounds: RoundInfo[] = Array.from({ length: settings.rounds }, () => ({}))
  if (settings.format === 'ball-knowledge') {
    planPrompts(rngFor('prompts', settings.seed), settings.rounds).forEach((id, i) => (rounds[i].promptId = id))
  }
  if (settings.format === 'time-machine') {
    planDecades(rngFor('decades', settings.seed), settings.rounds, eligiblePlayers, T).forEach((d, i) => (rounds[i].decade = d))
  }

  const state: DraftState = {
    settings,
    teams,
    order,
    picks: [],
    rosters: teams.map(() => []),
    taken: {},
    eligible,
    rounds,
    packs: {},
    rerolls: {},
    mulligans: teams.map(() => settings.mulligans),
    phase: FORMATS[settings.format].themed ? 'intro' : 'pick',
  }
  return ensureOffer(state)
}

export function promptPoolSize(teamCount: number): number {
  return Math.max(6, Math.min(14, teamCount + 3))
}

function ensureOffer(s: DraftState): DraftState {
  const cur = currentPick(s)
  if (!cur || s.phase === 'done' || s.phase === 'reveal') return s
  const { format, seed, packSize } = s.settings
  if (format === 'pack' && !s.packs[cur.overall]) {
    const rng = rngFor('pack', seed, cur.overall, s.rerolls[cur.overall] ?? 0)
    const pack = dealPack(rng, availablePlayers(s), packSize)
    return { ...s, packs: { ...s.packs, [cur.overall]: pack } }
  }
  if (format === 'ball-knowledge' && !s.rounds[cur.round].pool) {
    const prompt = PROMPT_BY_ID[s.rounds[cur.round].promptId as string]
    const rng = rngFor('bkpool', seed, cur.round)
    const pool = dealPromptPool(rng, prompt, availablePlayers(s), promptPoolSize(s.teams.length))
    const rounds = s.rounds.map((r, i) => (i === cur.round ? { ...r, pool } : r))
    return { ...s, rounds }
  }
  return s
}

export interface OfferItem {
  id: string
  ok: boolean
  reason?: string
}

export interface Offer {
  kind: 'board' | 'pack' | 'pool'
  items: OfferItem[]
  fallbackAnyEra?: boolean
}

export function offerOf(s: DraftState): Offer {
  const cur = currentPick(s)
  if (!cur) return { kind: 'board', items: [] }
  const { format } = s.settings
  const roster = rosterOf(s, cur.team)

  let kind: Offer['kind'] = 'board'
  let ids: string[]
  let fallbackAnyEra = false
  if (format === 'pack') {
    kind = 'pack'
    ids = (s.packs[cur.overall] ?? []).filter((id) => !s.taken[id])
  } else if (format === 'ball-knowledge') {
    kind = 'pool'
    ids = (s.rounds[cur.round].pool ?? []).filter((id) => !s.taken[id])
  } else if (format === 'time-machine') {
    const decade = s.rounds[cur.round].decade as number
    const inDecade = s.eligible.filter((id) => !s.taken[id] && getPlayer(id).decades.includes(decade))
    if (inDecade.length >= s.teams.length) ids = inDecade
    else {
      ids = s.eligible.filter((id) => !s.taken[id])
      fallbackAnyEra = true
    }
  } else {
    ids = s.eligible.filter((id) => !s.taken[id])
  }

  const items: OfferItem[] = ids.map((id) => ({ id, ok: true }))

  if (format === 'starting-five') {
    const slots = slotsFor(s.settings.rounds)
    for (const it of items) {
      const p = getPlayer(it.id)
      if (!assignSlots([...roster, p], slots)) {
        it.ok = false
        it.reason = `No open slot for a ${p.pos.join('/')}`
      }
    }
  }

  if (format === 'cap') {
    const left = budgetLeft(s, cur.team)
    const slotsAfter = s.settings.rounds - roster.length - 1
    const reserve = Math.max(0, slotsAfter) * MIN_PRICE
    for (const it of items) {
      const p = getPlayer(it.id)
      if (p.price > left - reserve) {
        it.ok = false
        it.reason = `Costs $${p.price}M, only $${Math.max(0, left - reserve)}M spendable`
      }
    }
    if (!items.some((i) => i.ok)) {
      const cheapest = [...items].sort((a, b) => getPlayer(a.id).price - getPlayer(b.id).price).slice(0, 6)
      for (const it of cheapest) {
        it.ok = true
        it.reason = undefined
      }
    }
  }

  return { kind, items, fallbackAnyEra }
}

export function canPick(s: DraftState, id: string): { ok: boolean; reason?: string } {
  if (s.phase !== 'pick') return { ok: false, reason: 'Not picking right now' }
  const item = offerOf(s).items.find((i) => i.id === id)
  if (!item) return { ok: false, reason: 'Not available this pick' }
  return { ok: item.ok, reason: item.reason }
}

function advance(s: DraftState): DraftState {
  const T = s.teams.length
  const done = s.picks.length >= s.order.length
  const roundJustEnded = s.picks.length % T === 0
  let phase: Phase = 'pick'
  if (s.settings.format === 'ball-knowledge' && roundJustEnded) phase = 'reveal'
  else if (done) phase = 'done'
  else if (s.settings.format === 'time-machine' && roundJustEnded) phase = 'intro'
  return ensureOffer({ ...s, phase })
}

export function makePick(s: DraftState, id: string, by: DraftPick['by']): DraftState {
  const cur = currentPick(s)
  if (!cur || s.phase !== 'pick') return s
  const check = canPick(s, id)
  if (!check.ok) return s
  const p = getPlayer(id)
  const pick: DraftPick = { overall: cur.overall, round: cur.round, team: cur.team, playerId: id, by }
  if (s.settings.format === 'ball-knowledge') {
    const prompt = PROMPT_BY_ID[s.rounds[cur.round].promptId as string]
    const pool = (s.rounds[cur.round].pool ?? []).filter((x) => !s.taken[x])
    pick.fit = Math.round(prompt.fit(p))
    pick.bestFit = Math.round(Math.max(...pool.map((x) => prompt.fit(getPlayer(x)))))
  }
  if (s.settings.format === 'cap') pick.cost = p.price
  const next: DraftState = {
    ...s,
    picks: [...s.picks, pick],
    rosters: s.rosters.map((r, i) => (i === cur.team ? [...r, id] : r)),
    taken: { ...s.taken, [id]: true },
  }
  return advance(next)
}

export function startRound(s: DraftState): DraftState {
  if (s.phase !== 'intro') return s
  return ensureOffer({ ...s, phase: 'pick' })
}

export function ackReveal(s: DraftState): DraftState {
  if (s.phase !== 'reveal') return s
  const done = s.picks.length >= s.order.length
  return ensureOffer({ ...s, phase: done ? 'done' : 'intro' })
}

export function takeMulligan(s: DraftState): DraftState {
  const cur = currentPick(s)
  if (!cur || s.phase !== 'pick' || s.settings.format !== 'pack') return s
  if (s.mulligans[cur.team] <= 0) return s
  const packs = { ...s.packs }
  delete packs[cur.overall]
  const next: DraftState = {
    ...s,
    packs,
    rerolls: { ...s.rerolls, [cur.overall]: (s.rerolls[cur.overall] ?? 0) + 1 },
    mulligans: s.mulligans.map((m, i) => (i === cur.team ? m - 1 : m)),
  }
  return ensureOffer(next)
}

export function isHumanOnClock(s: DraftState): boolean {
  const cur = currentPick(s)
  return !!cur && s.teams[cur.team].human
}
