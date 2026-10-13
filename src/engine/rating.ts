import { clamp } from './rng'
import type { Player } from './types'

export const ROTATION_WEIGHTS = [1, 0.96, 0.9, 0.84, 0.76, 0.5, 0.36, 0.24, 0.14, 0.08]
const WSUM = ROTATION_WEIGHTS.reduce((a, b) => a + b, 0)

export const LEAGUE_AVG_POWER = 86

export const REPLACEMENT: Player = {
  id: 'replacement',
  name: 'Replacement Level',
  nick: '',
  pos: ['SF'],
  ht: 78,
  ovr: 56,
  from: 2000,
  to: 2010,
  attrs: { fin: 50, sht: 50, hnd: 50, pas: 50, reb: 50, prd: 50, ind: 50, ath: 50, iq: 50 },
  rings: 0,
  mvps: 0,
  tags: {},
  tier: 'bronze',
  decades: [2000],
  active: false,
  price: 2,
  archetype: { key: 'glue', label: 'Replacement', icon: 'Sparkles' },
  off: 50,
  def: 50,
}

export interface Note {
  label: string
  detail: string
  delta: number
}

export interface TeamProfile {
  power: number
  talent: number
  offense: number
  defense: number
  shooting: number
  playmaking: number
  rebounding: number
  athleticism: number
  size: number
  chemistry: number
  notes: Note[]
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0)
const topN = (xs: number[], n: number) => [...xs].sort((a, b) => b - a).slice(0, n)

export function profileOf(roster: readonly Player[], opts: { fillTo?: number } = {}): TeamProfile {
  const fillTo = opts.fillTo ?? 10
  const sorted = [...roster].sort((a, b) => b.ovr - a.ovr).slice(0, 10)
  while (sorted.length < Math.max(fillTo, 10)) sorted.push(REPLACEMENT)
  const w = ROTATION_WEIGHTS
  const wavg = (f: (p: Player) => number) => sum(sorted.map((p, i) => f(p) * w[i])) / WSUM
  const top7 = sorted.slice(0, 7)
  const starters = sorted.slice(0, 5)

  const talent = wavg((p) => p.ovr)
  const offense = wavg((p) => p.off)
  const perimD = 0.5 * wavg((p) => p.attrs.prd) + 0.5 * avg(topN(top7.map((p) => p.attrs.prd), 2))
  const rimD = 0.5 * wavg((p) => p.attrs.ind) + 0.5 * Math.max(...top7.map((p) => p.attrs.ind))
  const defense = 0.5 * perimD + 0.5 * rimD
  const shooting = 0.5 * wavg((p) => p.attrs.sht) + 0.5 * avg(topN(top7.map((p) => p.attrs.sht), 3))
  const playmaking = 0.5 * wavg((p) => p.attrs.pas) + 0.5 * Math.max(...top7.map((p) => p.attrs.pas))
  const rebounding = 0.5 * wavg((p) => p.attrs.reb) + 0.5 * avg(topN(top7.map((p) => p.attrs.reb), 2))
  const athleticism = wavg((p) => p.attrs.ath)
  const size = avg(starters.map((p) => p.ht))

  const notes: Note[] = []
  const add = (label: string, detail: string, delta: number) => notes.push({ label, detail, delta })

  const bestHnd = Math.max(...top7.map((p) => p.attrs.hnd))
  const bestPas = Math.max(...top7.map((p) => p.attrs.pas))
  const bestInd = Math.max(...top7.map((p) => p.attrs.ind))
  const bestPrd = Math.max(...top7.map((p) => p.attrs.prd))
  const shooters = starters.filter((p) => p.attrs.sht >= 76).length
  const starterReb = avg(starters.map((p) => p.attrs.reb))
  const bigs = starters.filter((p) => p.pos[0] === 'C').length
  const pgs = starters.filter((p) => p.pos[0] === 'PG').length

  if (bestHnd < 70) add('No ball handler', 'Nobody can break a press or create off the dribble.', -4)
  else if (bestHnd < 80) add('Shaky handles', 'Limited shot creation off the dribble.', -1.5)
  else if (bestHnd >= 92) add('Elite creator', 'A handle that bends defenses.', 0.4)

  if (bestPas < 72) add('No playmaker', 'The ball sticks. Nobody sees the floor.', -2)
  else if (bestPas >= 94) add('Elite passer', 'Easy buckets for everybody.', 0.5)

  if (shooters === 0) add('Zero spacing', 'Defenders can pack the paint.', -4.5)
  else if (shooters === 1) add('Cramped spacing', 'Not enough shooters around the stars.', -2.4)
  else if (shooters === 2) add('Okay spacing', 'Could use another shooter.', -0.6)
  else if (shooters === 3) add('Good spacing', 'Enough threats to open the floor.', 0.3)
  else add('Five-out spacing', 'Defenders have to guard everywhere.', 0.9)

  if (bestInd < 66) add('No rim protection', 'Opponents live at the rim.', -3.5)
  else if (bestInd < 78) add('Soft interior', 'Not much deterrence inside.', -1.4)
  else if (bestInd >= 92) add('Elite rim protector', 'An anchor who erases mistakes.', 0.8)

  if (bestPrd < 70) add('No perimeter defender', 'Guards will score at will.', -1.5)
  else if (bestPrd >= 94) add('Lockdown defender', 'Takes the best scorer out of the game.', 0.6)

  if (starterReb < 58) add('Crushed on the glass', 'Second-chance points all night.', -2)
  else if (starterReb >= 78) add('Dominates the glass', 'Owns the boards.', 0.5)

  if (size < 76.5) add('Undersized', 'Giving up too much height.', -2.2)

  if (bigs >= 3) add('Traffic jam', 'Three centers in the starting five.', -2.2)
  if (pgs >= 3) add('Too many point guards', 'Only one ball to go around.', -1.6)

  const t1 = sorted[0].ovr
  const duo = (sorted[0].ovr + sorted[1].ovr) / 2
  const trio = (sorted[0].ovr + sorted[1].ovr + sorted[2].ovr) / 3
  if (trio >= 95) add('Big Three', 'Three of the best to ever do it.', 0.6)
  if (duo >= 96) add('Superstar duo', 'Two top-tier megastars.', 0.8)
  if (t1 >= 98) add('Generational talent', 'One player bends the whole game.', 0.8)

  const chemistry = clamp(sum(notes.map((n) => n.delta)), -12, 5)

  const power =
    talent +
    0.18 * (offense - REF.offense) +
    0.18 * (defense - REF.defense) +
    0.05 * (rebounding - REF.rebounding) +
    0.05 * (shooting - REF.shooting) +
    0.04 * (playmaking - REF.playmaking) +
    0.03 * (athleticism - REF.athleticism) +
    chemistry

  return { power, talent, offense, defense, shooting, playmaking, rebounding, athleticism, size, chemistry, notes }
}

/** Reference composition of a "typical" strong drafted team. */
export const REF = {
  offense: 79,
  defense: 72,
  rebounding: 78,
  shooting: 80,
  playmaking: 84,
  athleticism: 78,
}

export function powerOf(roster: readonly Player[]): number {
  return profileOf(roster).power
}

/** Power gain from adding a player, relative to current roster (replacement-filled). */
export function marginalPower(roster: readonly Player[], candidate: Player): number {
  return powerOf([...roster, candidate]) - powerOf(roster)
}

/** Expected point differential versus a league-average team. Convex above average so stars matter. */
export function marginOf(power: number): number {
  const d = power - LEAGUE_AVG_POWER
  return d >= 0 ? 1.25 * d : 0.6 * d
}

export function powerOfMargin(margin: number): number {
  return margin >= 0 ? LEAGUE_AVG_POWER + margin / 1.25 : LEAGUE_AVG_POWER + margin / 0.6
}

export interface Grade {
  letter: string
  label: string
  color: string
}

export function gradeOf(power: number): Grade {
  const table: Array<[number, string, string, string]> = [
    [106, 'S', 'All-Time Super Team', '#f0abfc'],
    [102, 'A+', 'Dynasty Material', '#fbbf24'],
    [99, 'A', 'Championship Favorite', '#a3e635'],
    [96, 'A-', 'Title Contender', '#86efac'],
    [93, 'B+', 'Playoff Lock', '#5eead4'],
    [90, 'B', 'Solid Squad', '#67e8f9'],
    [87, 'B-', 'Fringe Contender', '#93c5fd'],
    [84, 'C+', 'Bubble Team', '#c4b5fd'],
    [80, 'C', 'Mediocre', '#d4d4d8'],
    [74, 'D', 'Lottery Bound', '#fdba74'],
    [-Infinity, 'F', 'Tank Commander', '#f87171'],
  ]
  for (const [min, letter, label, color] of table) if (power >= min) return { letter, label, color }
  return { letter: 'F', label: 'Tank Commander', color: '#f87171' }
}

export function teamIdentity(roster: readonly Player[]): string {
  if (roster.length === 0) return 'Blank Slate'
  const p = profileOf(roster)
  const top = [...roster].sort((a, b) => b.ovr - a.ovr)
  if (p.shooting >= 90 && p.offense >= 88) return 'Splash Brothers Energy'
  if (p.defense >= 86) return 'Defense Wins Championships'
  if (p.size >= 82 && p.rebounding >= 86) return 'Twin Towers'
  if (p.size < 77) return 'Small-Ball Bombers'
  if (p.athleticism >= 88) return 'Above-the-Rim Circus'
  if (p.playmaking >= 94) return 'Pass-First Poetry'
  if (top[0] && top[0].ovr >= 98) return 'One Man Show (Plus Friends)'
  if (top.filter((x) => x.active).length >= Math.ceil(top.length * 0.7)) return 'The New Wave'
  if (top.filter((x) => x.to < 2000).length >= Math.ceil(top.length * 0.7)) return 'Old School Heads'
  return 'Balanced Attack'
}
