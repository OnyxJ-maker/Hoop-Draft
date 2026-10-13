import { describe, expect, it } from 'vitest'
import { getPlayer } from '@/data/players'
import { cpuChoose } from './cpu'
import {
  ackReveal,
  assignSlots,
  createDraft,
  makePick,
  offerOf,
  rosterOf,
  slotsFor,
  spentOf,
  startRound,
  takeMulligan,
  type DraftState,
  type TeamSetup,
} from './draft'
import { buildLTeams, bkBonus } from './finale'
import { FORMAT_ORDER, type FormatId } from './formats'
import { simPlayoffs, simRegularSeason, bracketOrder, computeAwards } from './league'
import { rngFor } from './rng'
import { formatOdds, makeLeague82, schedule82, simSeason82 } from './season82'
import { POOLS, poolPlayers } from './pool'

function makeTeams(n: number): TeamSetup[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    name: `Team ${i}`,
    owner: 'CPU',
    human: false,
    color: '#ffffff',
    icon: 'Star',
  }))
}

function runDraft(format: FormatId, teamCount: number, rounds: number, seed = 7): DraftState {
  let s = createDraft(
    {
      format,
      finale: 'league',
      rounds,
      pool: 'all',
      difficulty: 'pro',
      shotClock: 0,
      bestOf: 5,
      seasonRepeats: 2,
      mulligans: 1,
      packSize: 5,
      cap: Math.round(rounds * 13.5),
      seed,
    },
    makeTeams(teamCount),
  )
  let guard = 0
  while (s.phase !== 'done' && guard++ < 5000) {
    if (s.phase === 'intro') {
      s = startRound(s)
      continue
    }
    if (s.phase === 'reveal') {
      s = ackReveal(s)
      continue
    }
    const id = cpuChoose(s, rngFor('t', guard))
    expect(id).not.toBeNull()
    const next = makePick(s, id as string, 'cpu')
    expect(next.picks.length).toBe(s.picks.length + 1)
    s = next
  }
  expect(guard).toBeLessThan(5000)
  return s
}

describe('draft engine', () => {
  for (const format of FORMAT_ORDER) {
    for (const teams of [2, 5, 12]) {
      it(`${format} completes with ${teams} teams`, () => {
        const rounds = format === 'ball-knowledge' ? 8 : 7
        const s = runDraft(format, teams, rounds)
        expect(s.phase).toBe('done')
        expect(s.picks.length).toBe(teams * rounds)
        const ids = s.picks.map((p) => p.playerId)
        expect(new Set(ids).size).toBe(ids.length)
        s.rosters.forEach((r) => expect(r.length).toBe(rounds))
        if (format === 'starting-five') {
          for (let t = 0; t < teams; t++) expect(assignSlots(rosterOf(s, t), slotsFor(rounds))).not.toBeNull()
        }
        if (format === 'cap') {
          for (let t = 0; t < teams; t++) expect(spentOf(s, t)).toBeLessThanOrEqual(s.settings.cap + 6)
        }
        if (format === 'ball-knowledge') {
          s.picks.forEach((p) => expect(p.fit).toBeDefined())
        }
        if (format === 'time-machine') {
          const inDecade = s.picks.filter((p) => getPlayer(p.playerId).decades.includes(s.rounds[p.round].decade as number))
          expect(inDecade.length / s.picks.length).toBeGreaterThanOrEqual(teams >= 12 ? 0.85 : 1)
        }
      })
    }
  }

  it('snake order reverses every round', () => {
    const s = runDraft('snake', 4, 4)
    const first = s.order.slice(0, 4)
    expect(s.order.slice(4, 8)).toEqual([...first].reverse())
    expect(s.order.slice(8, 12)).toEqual(first)
  })

  it('pack mulligan changes the pack and is limited', () => {
    let s = createDraft(
      {
        format: 'pack',
        finale: 'league',
        rounds: 5,
        pool: 'all',
        difficulty: 'pro',
        shotClock: 0,
        bestOf: 5,
        seasonRepeats: 2,
        mulligans: 1,
        packSize: 5,
        cap: 70,
        seed: 3,
      },
      makeTeams(3),
    )
    const before = offerOf(s).items.map((i) => i.id)
    const team = s.order[0]
    s = takeMulligan(s)
    const after = offerOf(s).items.map((i) => i.id)
    expect(after).not.toEqual(before)
    expect(s.mulligans[team]).toBe(0)
    const again = takeMulligan(s)
    expect(again).toBe(s)
  })

  it('every pool has enough players for a sizeable draft', () => {
    for (const pool of POOLS) expect(poolPlayers(pool.id).length).toBeGreaterThan(50)
  })
})

describe('league sims', () => {
  it('plays a full season and playoffs for 8 and 12 teams', () => {
    for (const teams of [3, 4, 8, 12]) {
      const s = runDraft('snake', teams, 8, 11)
      const lteams = buildLTeams(s)
      const season = simRegularSeason(lteams, 2, 99)
      const gamesPerTeam = 2 * (teams - 1)
      season.standings.forEach((row) => expect(row.w + row.l).toBe(gamesPerTeam))
      const playoffs = simPlayoffs(lteams, season.standings.map((r) => r.idx), 7, 99)
      expect(playoffs.champion).toBeGreaterThanOrEqual(0)
      expect(playoffs.champion).toBeLessThan(teams)
      const finals = playoffs.rounds[playoffs.rounds.length - 1][0]
      expect(finals.winner).toBe(playoffs.champion)
      expect(playoffs.finalsMvp).not.toBeNull()
      const awards = computeAwards(season.totals, season.standings)
      expect(awards.mvp).not.toBeNull()
    }
  })

  it('bracket order is standard', () => {
    expect(bracketOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
    expect(bracketOrder(4)).toEqual([1, 4, 2, 3])
  })

  it('82 game season has 82 games and sane odds', () => {
    const s = runDraft('pack', 2, 8, 5)
    const roster = rosterOf(s, 0)
    const league = makeLeague82(5)
    const sched = schedule82(league, 5)
    expect(league.length).toBe(29)
    expect(sched.length).toBe(82)
    const result = simSeason82(roster, 95, league, sched, 'x')
    expect(result.games.length).toBe(82)
    expect(result.wins + result.losses).toBe(82)
    expect(formatOdds(result.perfectOdds)).toBeTruthy()
  })

  it('ball knowledge bonus is bounded', () => {
    expect(bkBonus(100)).toBeLessThanOrEqual(4)
    expect(bkBonus(0)).toBeGreaterThanOrEqual(-4)
  })
})
