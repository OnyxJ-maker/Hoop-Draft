import { describe, it } from 'vitest'
import { PLAYERS } from '@/data/players'
import { gradeOf, marginalPower, marginOf, powerOf, profileOf } from './rating'
import { gaussian, rngFor, weightedSample } from './rng'
import { makeLeague82, schedule82, simSeason82, perfectOdds } from './season82'
import type { Player } from './types'

function greedyBest(pool: Player[], n: number): Player[] {
  const roster: Player[] = []
  const left = pool.slice()
  while (roster.length < n) {
    let best = left[0]
    let bv = -Infinity
    for (const p of left) {
      const v = marginalPower(roster, p)
      if (v > bv) {
        bv = v
        best = p
      }
    }
    roster.push(best)
    left.splice(left.indexOf(best), 1)
  }
  return roster
}

function packDraft(seed: number, rounds: number, packSize: number, temp: number): Player[] {
  const rng = rngFor('cal', seed)
  const roster: Player[] = []
  const taken = new Set<string>()
  for (let r = 0; r < rounds; r++) {
    const pool = PLAYERS.filter((p) => !taken.has(p.id))
    const pack = weightedSample(rng, pool, (p) => Math.exp((p.ovr - 80) / temp), packSize)
    let best = pack[0]
    let bv = -Infinity
    for (const p of pack) {
      const v = marginalPower(roster, p) + gaussian(rng) * 0.4
      if (v > bv) {
        bv = v
        best = p
      }
    }
    roster.push(best)
    taken.add(best.id)
  }
  return roster
}

function describeTeam(label: string, roster: Player[]) {
  const prof = profileOf(roster)
  const g = gradeOf(prof.power)
  console.log(
    `${label}: power ${prof.power.toFixed(1)} (${g.letter}) talent ${prof.talent.toFixed(1)} off ${prof.offense.toFixed(1)} def ${prof.defense.toFixed(
      1,
    )} shoot ${prof.shooting.toFixed(1)} pm ${prof.playmaking.toFixed(1)} reb ${prof.rebounding.toFixed(1)} ath ${prof.athleticism.toFixed(
      1,
    )} chem ${prof.chemistry.toFixed(1)} margin ${marginOf(prof.power).toFixed(1)} | ${roster.map((p) => p.name.split(' ').slice(-1)[0]).join(', ')}`,
  )
}

const quant = (xs: number[], f: number) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(f * (s.length - 1))]
}

describe('calibration', () => {
  it('prints the landscape', () => {
    const dream = greedyBest(PLAYERS, 10)
    describeTeam('DREAM10', dream)
    describeTeam('DREAM8', greedyBest(PLAYERS, 8))
    const top8 = [...PLAYERS].sort((a, b) => b.ovr - a.ovr).slice(0, 8)
    describeTeam('TOP8 by OVR', top8)
    describeTeam('BOTTOM8', [...PLAYERS].sort((a, b) => a.ovr - b.ovr).slice(0, 8))
    describeTeam('MID 76-80', PLAYERS.filter((p) => p.ovr >= 76 && p.ovr <= 80).slice(0, 8))

    const league = makeLeague82(1)
    const sched = schedule82(league, 1)

    for (const [name, temp, rounds] of [
      ['uniform', 1e9, 8],
      ['temp-24', 24, 8],
      ['temp-16', 16, 8],
      ['temp-12', 12, 8],
    ] as const) {
      const powers: number[] = []
      const chems: number[] = []
      const wins: number[] = []
      let perfect = 0
      let oddsSum = 0
      for (let s = 0; s < 400; s++) {
        const roster = packDraft(s, rounds, 5, temp)
        const prof = profileOf(roster)
        powers.push(prof.power)
        chems.push(prof.chemistry)
        const season = simSeason82(roster, prof.power, league, sched, `cal-${s}`)
        wins.push(season.wins)
        if (season.wins === 82) perfect++
        oddsSum += season.perfectOdds
      }
      console.log(
        name,
        'power p5/p25/p50/p75/p95/max',
        [0.05, 0.25, 0.5, 0.75, 0.95, 1].map((f) => quant(powers, f).toFixed(1)).join(' / '),
        '| wins p5/p25/p50/p75/p95/max',
        [0.05, 0.25, 0.5, 0.75, 0.95, 1].map((f) => quant(wins, f)).join(' / '),
        '| chem p5/p50/p95',
        [0.05, 0.5, 0.95].map((f) => quant(chems, f).toFixed(1)).join(' / '),
        '| perfect',
        perfect,
        'mean odds',
        (oddsSum / 400).toExponential(2),
      )
    }

    console.log('dream power', powerOf(dream).toFixed(1), 'odds', perfectOdds(marginOf(powerOf(dream)), league, sched).toExponential(2))
  })
})
