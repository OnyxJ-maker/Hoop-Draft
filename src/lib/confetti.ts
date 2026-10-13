import confetti from 'canvas-confetti'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function burst(colors?: string[], particleCount = 90, origin = { x: 0.5, y: 0.6 }) {
  if (reduced()) return
  void confetti({ particleCount, spread: 75, startVelocity: 42, origin, colors, ticks: 180, scalar: 1.05 })
}

export function cannons(colors?: string[]) {
  if (reduced()) return
  const end = Date.now() + 1800
  const frame = () => {
    void confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors })
    void confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export function rain(colors?: string[], ms = 3500) {
  if (reduced()) return
  const end = Date.now() + ms
  const frame = () => {
    void confetti({ particleCount: 6, startVelocity: 18, spread: 360, ticks: 220, gravity: 0.6, origin: { x: Math.random(), y: -0.1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export const GOLD = ['#fbbf24', '#f59e0b', '#fde68a', '#ffffff', '#ff7a1a']
export const RAINBOW = ['#f43f9d', '#22d3ee', '#a3e635', '#fbbf24', '#8b5cf6', '#ff7a1a']
