import { getPlayer, PLAYERS } from '@/data/players'
import { PROMPT_BY_ID, verdictOf, type FitVerdict } from '@/data/prompts'
import { rosterOf, type DraftPick, type DraftState } from './draft'
import type { LTeam } from './league'
import { gradeOf, marginOf, profileOf, teamIdentity, type Grade, type TeamProfile } from './rating'
import { clamp } from './rng'
import type { Player } from './types'

export function teamAvgFit(s: DraftState, team: number): number {
  const picks = s.picks.filter((p) => p.team === team && p.fit !== undefined)
  if (picks.length === 0) return 0
  return picks.reduce((sum, p) => sum + (p.fit ?? 0), 0) / picks.length
}

export function bkBonus(avgFit: number): number {
  return clamp((avgFit - 50) * 0.12, -4, 4)
}

export function teamBonus(s: DraftState, team: number): number {
  return s.settings.format === 'ball-knowledge' ? bkBonus(teamAvgFit(s, team)) : 0
}

export function buildLTeams(s: DraftState): LTeam[] {
  return s.teams.map((t, i) => {
    const roster = rosterOf(s, i)
    const power = profileOf(roster).power + teamBonus(s, i)
    return { idx: i, name: t.name, color: t.color, icon: t.icon, roster, power, margin: marginOf(power) }
  })
}

export interface TeamReport {
  team: number
  roster: Player[]
  profile: TeamProfile
  power: number
  bonus: number
  grade: Grade
  identity: string
  bestPick?: DraftPick
  avgFit: number
  perfectReads: number
}

export function teamReport(s: DraftState, team: number): TeamReport {
  const roster = rosterOf(s, team)
  const profile = profileOf(roster)
  const bonus = teamBonus(s, team)
  const power = profile.power + bonus
  const picks = s.picks.filter((p) => p.team === team)
  const best = [...picks].sort((a, b) => getPlayer(b.playerId).ovr - getPlayer(a.playerId).ovr)[0]
  return {
    team,
    roster,
    profile,
    power,
    bonus,
    grade: gradeOf(power),
    identity: teamIdentity(roster),
    bestPick: best,
    avgFit: teamAvgFit(s, team),
    perfectReads: picks.filter((p) => (p.fit ?? 0) >= 85).length,
  }
}

const OVR_RANK: Map<string, number> = new Map(
  [...PLAYERS].sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name)).map((p, i) => [p.id, i + 1]),
)

export interface PickValue {
  pick: DraftPick
  delta: number
  tag: 'steal' | 'reach' | 'fair'
}

/** Positive delta means the player went later than his OVR rank suggests (a steal). */
export function pickValue(s: DraftState, pick: DraftPick): PickValue {
  const rank = OVR_RANK.get(pick.playerId) ?? 100
  const delta = pick.overall + 1 - rank
  const tag = delta >= 18 ? 'steal' : delta <= -22 ? 'reach' : 'fair'
  return { pick, delta, tag }
}

export function bkPickReport(s: DraftState, pick: DraftPick) {
  const round = s.rounds[pick.round]
  const prompt = PROMPT_BY_ID[round.promptId as string]
  const player = getPlayer(pick.playerId)
  const fit = pick.fit ?? 0
  const verdict: FitVerdict = verdictOf(fit)
  return { prompt, player, fit, bestFit: pick.bestFit ?? fit, verdict }
}

export function bkRoundRanking(s: DraftState, round: number) {
  const info = s.rounds[round]
  const prompt = PROMPT_BY_ID[info.promptId as string]
  const pool = info.pool ?? []
  const picksInRound = s.picks.filter((p) => p.round === round)
  return pool
    .map((id) => {
      const player = getPlayer(id)
      const pick = picksInRound.find((p) => p.playerId === id)
      return { player, fit: Math.round(prompt.fit(player)), pick }
    })
    .sort((a, b) => b.fit - a.fit || b.player.ovr - a.player.ovr)
}

export interface StandingsRow {
  team: number
  wins: number
  losses: number
}
