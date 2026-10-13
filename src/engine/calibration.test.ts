import { describe, expect, it } from 'vitest'
import { PLAYERS } from '@/data/players'
import { gradeOf, marginOf, marginalPower, powerOf, profileOf } from './rating'
import { gaussian, rngFor, weightedSample } from './rng'
import { makeLeague82, perfectOdds, schedule82, simSeason82 } from './season82'
import type { Player } from './types'

/**
 * These tests pin the game balance: 82-0 should be rare but reachable, typical
 * star-studded drafts should win a lot, and bad rosters should lose a lot.
 */

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

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

describe('game balance', () => {
  const league = makeLeague82(1)
  const sched = schedule82(league, 1)

  it('the best possible roster has a real shot at 82-0', () => {
    const dream = greedyBest(PLAYERS, 10)
    const odds = perfectOdds(marginOf(powerOf(dream)), league, sched)
    expect(odds).toBeGreaterThan(0.1)
    expect(odds).toBeLessThan(0.9)
    expect(gradeOf(powerOf(dream)).letter).toBe('S')
  })

  it('raw top-8 by OVR is strong but chemistry matters', () => {
    const top8 = [...PLAYERS].sort((a, b) => b.ovr - a.ovr).slice(0, 8)
    const dream8 = greedyBest(PLAYERS, 8)
    expect(powerOf(dream8)).toBeGreaterThan(powerOf(top8) - 0.5)
  })

  it('a roster of the worst players is a disaster, a roster of role players is mediocre', () => {
    const bottom = [...PLAYERS].sort((a, b) => a.ovr - b.ovr).slice(0, 8)
    expect(gradeOf(powerOf(bottom)).letter).toBe('F')
    const role = PLAYERS.filter((p) => p.ovr >= 76 && p.ovr <= 80).slice(0, 8)
    expect(marginOf(powerOf(role))).toBeLessThan(2)
  })

  it('typical star-heavy pack drafts win a lot, but almost never go perfect', () => {
    const wins: number[] = []
    let perfect = 0
    for (let s = 0; s < 120; s++) {
      const roster = packDraft(s, 8, 5, 22)
      const power = profileOf(roster).power
      const season = simSeason82(roster, power, league, sched, `cal-${s}`)
      wins.push(season.wins)
      if (season.wins === 82) perfect++
    }
    const m = median(wins)
    expect(m).toBeGreaterThanOrEqual(68)
    expect(m).toBeLessThanOrEqual(80)
    expect(perfect).toBeLessThanOrEqual(8)
  })

  it('incomplete rosters do not produce chemistry penalties out of proportion', () => {
    const star = PLAYERS.find((p) => p.id === 'michael-jordan') as Player
    const short = PLAYERS.find((p) => p.id === 'muggsy-bogues') as Player
    expect(marginalPower([], star)).toBeGreaterThan(5)
    expect(marginalPower([star], short)).toBeGreaterThan(-3)
  })
})
