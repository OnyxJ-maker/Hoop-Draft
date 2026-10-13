import { clamp, gaussian, type Rng } from './rng'
import type { Player } from './types'

export interface BoxLine {
  id: string
  name: string
  min: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
}

const MINUTES = [35, 34, 33, 31, 29, 22, 18, 14, 10]

function allocateCount(rng: Rng, total: number, weights: number[]): number[] {
  const out = new Array<number>(weights.length).fill(0)
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return out
  for (let i = 0; i < total; i++) {
    let r = rng() * sum
    let idx = 0
    for (; idx < weights.length - 1; idx++) {
      r -= weights[idx]
      if (r <= 0) break
    }
    out[idx]++
  }
  return out
}

function allocateProportional(rng: Rng, total: number, weights: number[]): number[] {
  const noisy = weights.map((w) => w * Math.exp(0.32 * gaussian(rng)))
  const sum = noisy.reduce((a, b) => a + b, 0)
  const out = noisy.map((w) => Math.round((total * w) / sum))
  const diff = total - out.reduce((a, b) => a + b, 0)
  let topIdx = 0
  noisy.forEach((w, i) => {
    if (w > noisy[topIdx]) topIdx = i
  })
  out[topIdx] = Math.max(0, out[topIdx] + diff)
  return out
}

export function genBox(roster: readonly Player[], teamPts: number, rng: Rng): BoxLine[] {
  const rot = [...roster].sort((a, b) => b.ovr - a.ovr).slice(0, 9)
  if (rot.length === 0) return []
  const mins = rot.map((_, i) => clamp(MINUTES[i] + gaussian(rng) * 2, 4, 42))

  const ptsW = rot.map((p, i) => {
    const attr = 0.7 * Math.max(p.attrs.fin, p.attrs.sht) + 0.3 * p.attrs.hnd
    return Math.pow(p.ovr / 100, 6) * (0.35 + (0.65 * attr) / 100) * mins[i]
  })
  const rebW = rot.map((p, i) => Math.pow(p.attrs.reb / 100, 3) * mins[i] * Math.pow(p.ht / 78, 4))
  const astW = rot.map((p, i) => Math.pow(p.attrs.pas / 100, 3) * mins[i] * (0.5 + p.attrs.hnd / 200))
  const stlW = rot.map((p, i) => Math.pow(p.attrs.prd / 100, 4) * mins[i] * (0.6 + p.attrs.ath / 200))
  const blkW = rot.map((p, i) => Math.pow(p.attrs.ind / 100, 4) * mins[i] * Math.pow(p.ht / 78, 3))

  const pts = allocateProportional(rng, teamPts, ptsW)
  const reb = allocateCount(rng, Math.round(clamp(43 + gaussian(rng) * 5, 30, 58)), rebW)
  const ast = allocateCount(rng, Math.round(clamp(24 + gaussian(rng) * 4.5, 12, 38)), astW)
  const stl = allocateCount(rng, Math.round(clamp(7.5 + gaussian(rng) * 2, 2, 14)), stlW)
  const blk = allocateCount(rng, Math.round(clamp(5 + gaussian(rng) * 1.8, 1, 11)), blkW)

  return rot.map((p, i) => ({
    id: p.id,
    name: p.name,
    min: Math.round(mins[i]),
    pts: pts[i],
    reb: reb[i],
    ast: ast[i],
    stl: stl[i],
    blk: blk[i],
  }))
}

export function gameScoreOf(l: BoxLine): number {
  return l.pts + 0.7 * l.reb + 0.8 * l.ast + 1.5 * l.stl + 1.3 * l.blk
}

export function topPerformer(box: readonly BoxLine[]): BoxLine | undefined {
  let best: BoxLine | undefined
  for (const l of box) if (!best || gameScoreOf(l) > gameScoreOf(best)) best = l
  return best
}

export function statLine(l: BoxLine): string {
  const extras: string[] = []
  if (l.stl >= 3) extras.push(`${l.stl} stl`)
  if (l.blk >= 3) extras.push(`${l.blk} blk`)
  return `${l.pts} pts, ${l.reb} reb, ${l.ast} ast${extras.length ? `, ${extras.join(', ')}` : ''}`
}

export interface SeasonTotals {
  id: string
  name: string
  team: number
  gp: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
}

export function addToTotals(map: Map<string, SeasonTotals>, team: number, box: readonly BoxLine[]): void {
  for (const l of box) {
    const key = `${team}:${l.id}`
    let t = map.get(key)
    if (!t) {
      t = { id: l.id, name: l.name, team, gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 }
      map.set(key, t)
    }
    t.gp++
    t.pts += l.pts
    t.reb += l.reb
    t.ast += l.ast
    t.stl += l.stl
    t.blk += l.blk
  }
}
