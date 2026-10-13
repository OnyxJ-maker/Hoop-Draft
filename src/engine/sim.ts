import { clamp, gaussian, normCdf, type Rng } from './rng'

/** Standard deviation of single-game point differential. */
export const SIGMA = 10.5
export const HOME_EDGE = 2.2

/** home: +1 if team A is at home, -1 if away, 0 neutral. */
export function winProb(marginA: number, marginB: number, home: -1 | 0 | 1 = 0): number {
  return normCdf((marginA - marginB + home * HOME_EDGE) / SIGMA)
}

export interface GameScore {
  a: number
  b: number
  ot: boolean
  aWon: boolean
}

export function simScore(marginA: number, marginB: number, home: -1 | 0 | 1, rng: Rng): GameScore {
  const mu = marginA - marginB + home * HOME_EDGE
  const diff = mu + gaussian(rng) * SIGMA
  const total = clamp(214 + gaussian(rng) * 13, 176, 256)
  let a = Math.round((total + diff) / 2)
  let b = Math.round((total - diff) / 2)
  a = Math.max(a, 74)
  b = Math.max(b, 74)
  let ot = false
  if (a === b) {
    ot = true
    const bump = 3 + Math.floor(rng() * 6)
    if (diff > 0 || (diff === 0 && rng() < 0.5)) {
      a += bump + 1
      b += bump
    } else {
      b += bump + 1
      a += bump
    }
  }
  return { a, b, ot, aWon: a > b }
}

export interface SeriesFormat {
  bestOf: 1 | 3 | 5 | 7
}

/** Home pattern for a series, from the higher seed's perspective: +1 home, -1 away. */
export function seriesHomePattern(bestOf: number): Array<1 | -1> {
  const base: Array<1 | -1> =
    bestOf === 1
      ? [1]
      : bestOf === 3
        ? [1, -1, 1]
        : bestOf === 5
          ? [1, 1, -1, -1, 1]
          : [1, 1, -1, -1, 1, -1, 1]
  return base
}
