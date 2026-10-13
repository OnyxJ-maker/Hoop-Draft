import { describe, expect, it } from 'vitest'
import { PLAYERS } from './players'
import { PROMPTS } from './prompts'

describe('prompts', () => {
  it('every prompt has several strong candidates and a sane spread', () => {
    for (const prompt of PROMPTS) {
      const fits = PLAYERS.map((p) => ({ p, fit: prompt.fit(p) }))
      for (const f of fits) {
        expect(f.fit).toBeGreaterThanOrEqual(0)
        expect(f.fit).toBeLessThanOrEqual(100)
      }
      const strong = fits.filter((f) => f.fit >= 40).length
      expect(strong, `${prompt.id} strong candidates`).toBeGreaterThanOrEqual(5)
    }
  })
})
