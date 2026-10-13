import { FRANCHISES, franchiseName } from '@/data/franchises'
import { marginOf, powerOfMargin } from './rating'
import { clamp, gaussian, rngFor, shuffle } from './rng'
import { simScore, winProb } from './sim'
import { genBox, statLine, topPerformer } from './stats'
import type { Player } from './types'

export interface Opp {
  id: string
  name: string
  color: string
  icon: string
  power: number
  margin: number
}

export function makeLeague82(seed: number, excludeNames: string[] = [], size = 29): Opp[] {
  const rng = rngFor('league82', seed)
  const pool = FRANCHISES.filter((f) => !excludeNames.includes(franchiseName(f)))
  return shuffle(rng, pool)
    .slice(0, size)
    .map((f) => {
      const margin = clamp(gaussian(rng) * 4.4, -10, 10)
      return { id: f.id, name: franchiseName(f), color: f.color, icon: f.icon, power: powerOfMargin(margin), margin }
    })
}

export interface ScheduledGame {
  opp: number
  home: boolean
}

export function schedule82(league: readonly Opp[], seed: number): ScheduledGame[] {
  const rng = rngFor('sched82', seed)
  const games: ScheduledGame[] = []
  league.forEach((_, i) => {
    games.push({ opp: i, home: true }, { opp: i, home: false })
  })
  const extra = shuffle(
    rng,
    league.map((_, i) => i),
  ).slice(0, Math.max(0, Math.floor((82 - games.length) / 2)))
  extra.forEach((i) => games.push({ opp: i, home: true }, { opp: i, home: false }))
  const shuffled = shuffle(rng, games)
  return shuffled.slice(0, 82)
}

export interface Game82 {
  n: number
  opp: number
  home: boolean
  win: boolean
  us: number
  them: number
  ot: boolean
  winProb: number
  star: string
  starLine: string
}

export interface Season82Result {
  games: Game82[]
  wins: number
  losses: number
  longestStreak: number
  firstLoss: number | null
  perfectOdds: number
  margin: number
}

export function perfectOdds(margin: number, league: readonly Opp[], sched: readonly ScheduledGame[]): number {
  let p = 1
  for (const g of sched) p *= winProb(margin, league[g.opp].margin, g.home ? 1 : -1)
  return p
}

export function expectedWins(margin: number, league: readonly Opp[], sched: readonly ScheduledGame[]): number {
  let w = 0
  for (const g of sched) w += winProb(margin, league[g.opp].margin, g.home ? 1 : -1)
  return w
}

export function simSeason82(
  roster: readonly Player[],
  power: number,
  league: readonly Opp[],
  sched: readonly ScheduledGame[],
  seed: string,
): Season82Result {
  const margin = marginOf(power)
  const games: Game82[] = []
  let wins = 0
  let longest = 0
  let streak = 0
  let firstLoss: number | null = null
  sched.forEach((g, i) => {
    const rng = rngFor('g82', seed, i)
    const opp = league[g.opp]
    const score = simScore(margin, opp.margin, g.home ? 1 : -1, rng)
    const box = genBox(roster, score.a, rng)
    const star = topPerformer(box)
    const win = score.aWon
    if (win) {
      wins++
      streak++
      longest = Math.max(longest, streak)
    } else {
      streak = 0
      if (firstLoss === null) firstLoss = i + 1
    }
    games.push({
      n: i + 1,
      opp: g.opp,
      home: g.home,
      win,
      us: score.a,
      them: score.b,
      ot: score.ot,
      winProb: winProb(margin, opp.margin, g.home ? 1 : -1),
      star: star?.name ?? '',
      starLine: star ? statLine(star) : '',
    })
  })
  return {
    games,
    wins,
    losses: games.length - wins,
    longestStreak: longest,
    firstLoss,
    perfectOdds: perfectOdds(margin, league, sched),
    margin,
  }
}

export function formatOdds(p: number): string {
  if (p >= 0.1) return `${(p * 100).toFixed(0)}%`
  if (p >= 0.01) return `${(p * 100).toFixed(1)}%`
  if (p >= 0.0001) return `${(p * 100).toFixed(2)}%`
  if (p > 0) return '< 0.01%'
  return '0%'
}
