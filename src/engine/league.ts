import { rngFor } from './rng'
import { seriesHomePattern, simScore } from './sim'
import { addToTotals, gameScoreOf, genBox, topPerformer, type BoxLine, type SeasonTotals } from './stats'
import type { Player } from './types'

export interface LTeam {
  idx: number
  name: string
  color: string
  icon: string
  roster: Player[]
  power: number
  margin: number
}

export interface LGame {
  week: number
  home: number
  away: number
  hs: number
  as: number
  ot: boolean
  homeBox: BoxLine[]
  awayBox: BoxLine[]
}

/** Circle-method round robin. Returns weeks of [home, away] pairs. */
export function buildSchedule(n: number, repeats: number, seed: number): Array<Array<[number, number]>> {
  const rng = rngFor('schedule', seed)
  const ids: number[] = Array.from({ length: n }, (_, i) => i)
  if (ids.length % 2 === 1) ids.push(-1)
  const m = ids.length
  const rounds: Array<Array<[number, number]>> = []
  const arr = ids.slice()
  for (let r = 0; r < m - 1; r++) {
    const pairs: Array<[number, number]> = []
    for (let i = 0; i < m / 2; i++) {
      const a = arr[i]
      const b = arr[m - 1 - i]
      if (a === -1 || b === -1) continue
      pairs.push((i + r) % 2 === 0 ? [a, b] : [b, a])
    }
    rounds.push(pairs)
    arr.splice(1, 0, arr.pop() as number)
  }
  const weeks: Array<Array<[number, number]>> = []
  for (let rep = 0; rep < repeats; rep++) {
    const order = rounds.map((_, i) => i)
    for (let i = order.length - 1; i > 0 && rep > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    for (const ri of order) {
      weeks.push(rounds[ri].map(([h, a]) => (rep % 2 === 1 ? ([a, h] as [number, number]) : ([h, a] as [number, number]))))
    }
  }
  return weeks
}

export interface Standing {
  idx: number
  w: number
  l: number
  pf: number
  pa: number
  streak: number
  last5: boolean[]
}

export function computeStandings(n: number, games: readonly LGame[]): Standing[] {
  const table: Standing[] = Array.from({ length: n }, (_, idx) => ({ idx, w: 0, l: 0, pf: 0, pa: 0, streak: 0, last5: [] }))
  for (const g of games) {
    const h = table[g.home]
    const a = table[g.away]
    h.pf += g.hs
    h.pa += g.as
    a.pf += g.as
    a.pa += g.hs
    const homeWon = g.hs > g.as
    const apply = (s: Standing, won: boolean) => {
      if (won) {
        s.w++
        s.streak = s.streak > 0 ? s.streak + 1 : 1
      } else {
        s.l++
        s.streak = s.streak < 0 ? s.streak - 1 : -1
      }
      s.last5.push(won)
      if (s.last5.length > 5) s.last5.shift()
    }
    apply(h, homeWon)
    apply(a, !homeWon)
  }
  return table.sort((x, y) => y.w - x.w || y.pf - y.pa - (x.pf - x.pa) || x.idx - y.idx)
}

export interface RegularSeason {
  weeks: LGame[][]
  standings: Standing[]
  totals: SeasonTotals[]
}

export function simRegularSeason(teams: readonly LTeam[], repeats: number, seed: number): RegularSeason {
  const sched = buildSchedule(teams.length, repeats, seed)
  const totals = new Map<string, SeasonTotals>()
  const weeks: LGame[][] = sched.map((pairs, w) =>
    pairs.map(([h, a], gi) => {
      const rng = rngFor('lg', seed, w, gi)
      const th = teams[h]
      const ta = teams[a]
      const score = simScore(th.margin, ta.margin, 1, rng)
      const homeBox = genBox(th.roster, score.a, rng)
      const awayBox = genBox(ta.roster, score.b, rng)
      addToTotals(totals, h, homeBox)
      addToTotals(totals, a, awayBox)
      return { week: w, home: h, away: a, hs: score.a, as: score.b, ot: score.ot, homeBox, awayBox }
    }),
  )
  const all = weeks.flat()
  return { weeks, standings: computeStandings(teams.length, all), totals: [...totals.values()] }
}

export interface SeriesGame {
  home: number
  away: number
  hs: number
  as: number
  ot: boolean
  homeBox: BoxLine[]
  awayBox: BoxLine[]
}

export interface Series {
  round: number
  slot: number
  high: number
  low: number
  bestOf: number
  games: SeriesGame[]
  winner: number
  highWins: number
  lowWins: number
}

export interface PlayoffResult {
  seeds: number[]
  rounds: Series[][]
  champion: number
  finalsMvp: { id: string; name: string; team: number; score: number } | null
}

export function bracketOrder(n: number): number[] {
  let order = [1]
  while (order.length < n) {
    const size = order.length * 2
    order = order.flatMap((s) => [s, size + 1 - s])
  }
  return order
}

export function playoffSize(n: number): number {
  if (n >= 8) return 8
  if (n >= 4) return 4
  return 2
}

export function simSeries(
  high: LTeam,
  low: LTeam,
  bestOf: number,
  round: number,
  slot: number,
  seed: number,
): Series {
  const need = Math.floor(bestOf / 2) + 1
  const pattern = seriesHomePattern(bestOf)
  const games: SeriesGame[] = []
  let hw = 0
  let lw = 0
  let g = 0
  while (hw < need && lw < need) {
    const rng = rngFor('series', seed, round, slot, g)
    const highHome = pattern[g % pattern.length] === 1
    const home = highHome ? high : low
    const away = highHome ? low : high
    const score = simScore(home.margin, away.margin, 1, rng)
    const homeBox = genBox(home.roster, score.a, rng)
    const awayBox = genBox(away.roster, score.b, rng)
    games.push({ home: home.idx, away: away.idx, hs: score.a, as: score.b, ot: score.ot, homeBox, awayBox })
    const homeWon = score.aWon
    if (homeWon === highHome) hw++
    else lw++
    g++
  }
  return { round, slot, high: high.idx, low: low.idx, bestOf, games, winner: hw > lw ? high.idx : low.idx, highWins: hw, lowWins: lw }
}

export function simPlayoffs(
  teams: readonly LTeam[],
  seedOrder: readonly number[],
  bestOf: number,
  seed: number,
): PlayoffResult {
  const size = playoffSize(teams.length)
  const seeds = seedOrder.slice(0, size)
  const order = bracketOrder(size)
  let alive = order.map((s) => seeds[s - 1])
  const rounds: Series[][] = []
  let round = 0
  while (alive.length > 1) {
    const series: Series[] = []
    const next: number[] = []
    for (let i = 0; i < alive.length; i += 2) {
      const a = alive[i]
      const b = alive[i + 1]
      const aSeed = seeds.indexOf(a)
      const bSeed = seeds.indexOf(b)
      const [high, low] = aSeed <= bSeed ? [a, b] : [b, a]
      const s = simSeries(teams[high], teams[low], bestOf, round, i / 2, seed)
      series.push(s)
      next.push(s.winner)
    }
    rounds.push(series)
    alive = next
    round++
  }
  const champion = alive[0]
  const finals = rounds[rounds.length - 1][0]
  const scores = new Map<string, { id: string; name: string; team: number; score: number }>()
  for (const g of finals.games) {
    for (const [box, team] of [
      [g.homeBox, g.home],
      [g.awayBox, g.away],
    ] as const) {
      if (team !== champion) continue
      for (const l of box) {
        const key = l.id
        const cur = scores.get(key) ?? { id: l.id, name: l.name, team, score: 0 }
        cur.score += gameScoreOf(l)
        scores.set(key, cur)
      }
    }
  }
  const finalsMvp = [...scores.values()].sort((a, b) => b.score - a.score)[0] ?? null
  return { seeds, rounds, champion, finalsMvp }
}

export function seriesTopPerformer(s: Series, winner: boolean): BoxLine | undefined {
  const lines: BoxLine[] = []
  for (const g of s.games) {
    const winnerHome = g.hs > g.as ? g.home : g.away
    for (const [box, team] of [
      [g.homeBox, g.home],
      [g.awayBox, g.away],
    ] as const) {
      const isWinnerTeam = team === s.winner
      if (isWinnerTeam === winner) lines.push(...box)
      void winnerHome
    }
  }
  return topPerformer(lines)
}

export interface Awards {
  mvp: SeasonTotals | null
  scoring: SeasonTotals | null
  rebounding: SeasonTotals | null
  assists: SeasonTotals | null
  defense: SeasonTotals | null
}

export function computeAwards(totals: readonly SeasonTotals[], standings: readonly Standing[]): Awards {
  const winPct = new Map<number, number>()
  for (const s of standings) winPct.set(s.idx, s.w / Math.max(1, s.w + s.l))
  const per = (t: SeasonTotals, f: (t: SeasonTotals) => number) => f(t) / Math.max(1, t.gp)
  const eligible = totals.filter((t) => t.gp >= 3)
  const best = (f: (t: SeasonTotals) => number) =>
    eligible.length ? [...eligible].sort((a, b) => f(b) - f(a))[0] : null
  return {
    mvp: best((t) => per(t, (x) => x.pts + 0.7 * x.reb + 0.9 * x.ast + 1.4 * x.stl + 1.2 * x.blk) * (0.5 + (winPct.get(t.team) ?? 0.5))),
    scoring: best((t) => per(t, (x) => x.pts)),
    rebounding: best((t) => per(t, (x) => x.reb)),
    assists: best((t) => per(t, (x) => x.ast)),
    defense: best((t) => per(t, (x) => x.stl * 1.8 + x.blk * 1.6 + x.reb * 0.15)),
  }
}
