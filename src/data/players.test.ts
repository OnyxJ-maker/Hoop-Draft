import { describe, expect, it } from 'vitest'
import { MISSING_TAG_NAMES, PLAYERS } from './players'
import { ATTR_KEYS, TAG_KEYS } from '@/engine/types'

describe('player database', () => {
  it('parses every line with valid ranges', () => {
    expect(PLAYERS.length).toBeGreaterThan(250)
    const ids = new Set<string>()
    for (const p of PLAYERS) {
      expect(ids.has(p.id), `duplicate id ${p.id}`).toBe(false)
      ids.add(p.id)
      expect(p.ovr).toBeGreaterThanOrEqual(55)
      expect(p.ovr).toBeLessThanOrEqual(99)
      expect(p.ht).toBeGreaterThanOrEqual(60)
      expect(p.ht).toBeLessThanOrEqual(92)
      expect(p.to).toBeGreaterThanOrEqual(p.from)
      expect(p.pos.length).toBeGreaterThan(0)
      for (const pos of p.pos) expect(['PG', 'SG', 'SF', 'PF', 'C']).toContain(pos)
      for (const k of ATTR_KEYS) {
        expect(p.attrs[k], `${p.name}.${k}`).toBeGreaterThanOrEqual(8)
        expect(p.attrs[k], `${p.name}.${k}`).toBeLessThanOrEqual(99)
      }
      expect(p.decades.length).toBeGreaterThan(0)
    }
  })

  it('maps every tagged name to a real player', () => {
    expect(MISSING_TAG_NAMES).toEqual([])
  })

  it('has enough players per decade for big drafts', () => {
    const byDecade = new Map<number, number>()
    for (const p of PLAYERS) for (const d of p.decades) byDecade.set(d, (byDecade.get(d) ?? 0) + 1)
    console.log('decade counts', [...byDecade.entries()].sort((a, b) => a[0] - b[0]))
    for (const d of [1980, 1990, 2000, 2010, 2020]) expect(byDecade.get(d) ?? 0).toBeGreaterThanOrEqual(30)
  })

  it('has meaningful tag coverage', () => {
    for (const k of TAG_KEYS) {
      const n = PLAYERS.filter((p) => (p.tags[k] ?? 0) >= 2).length
      expect(n, `tag ${k}`).toBeGreaterThanOrEqual(5)
    }
  })

  it('tier distribution looks sane', () => {
    const counts: Record<string, number> = {}
    for (const p of PLAYERS) counts[p.tier] = (counts[p.tier] ?? 0) + 1
    console.log('tiers', counts, 'total', PLAYERS.length)
  })
})
