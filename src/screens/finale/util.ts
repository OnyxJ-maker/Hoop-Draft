export function roundName(round: number, rounds: number): string {
  const fromEnd = rounds - 1 - round
  if (fromEnd === 0) return 'The Finals'
  if (fromEnd === 1) return 'Semifinals'
  if (fromEnd === 2) return 'Quarterfinals'
  return `Round ${round + 1}`
}
