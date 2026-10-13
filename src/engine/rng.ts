export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(...parts: Array<string | number>): number {
  let h = 2166136261 >>> 0
  for (const part of parts) {
    const s = String(part)
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619) >>> 0
    }
    h ^= 0x9e
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

export function rngFor(...parts: Array<string | number>): Rng {
  return mulberry32(hashSeed(...parts))
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function pickOne<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function gaussian(rng: Rng): number {
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function weightedSample<T>(rng: Rng, items: readonly T[], weight: (t: T) => number, count: number): T[] {
  const pool = items.map((item) => ({ item, w: Math.max(0.0001, weight(item)) }))
  const out: T[] = []
  while (out.length < count && pool.length > 0) {
    const total = pool.reduce((s, x) => s + x.w, 0)
    let r = rng() * total
    let idx = 0
    for (; idx < pool.length; idx++) {
      r -= pool[idx].w
      if (r <= 0) break
    }
    const chosen = pool.splice(Math.min(idx, pool.length - 1), 1)[0]
    out.push(chosen.item)
  }
  return out
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** Standard normal CDF. */
export function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp((-x * x) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x > 0 ? 1 - p : p
}
