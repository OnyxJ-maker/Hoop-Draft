import { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { marginOf, profileOf, projectRoster } from '@/engine/rating'
import { expectedWins, formatOdds, makeLeague82, perfectOdds, schedule82 } from '@/engine/season82'
import type { Player } from '@/engine/types'

export function PerfectMeter({ roster, seed, size, teamNames }: { roster: Player[]; seed: number; size: number; teamNames: string[] }) {
  const namesKey = teamNames.join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const league = useMemo(() => makeLeague82(seed, teamNames), [seed, namesKey])
  const sched = useMemo(() => schedule82(league, seed), [league, seed])
  const power = useMemo(() => profileOf(projectRoster(roster, size)).power, [roster, size])
  const margin = marginOf(power)
  const odds = perfectOdds(margin, league, sched)
  const wins = expectedWins(margin, league, sched)
  const frac = Math.max(0, Math.min(1, (Math.log10(Math.max(odds, 1e-9)) + 7) / 7))
  const hot = odds >= 0.1
  return (
    <div className="mb-3 rounded-xl border border-lime-300/30 bg-gradient-to-r from-lime-400/15 to-transparent px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <div>
          <div className="font-cond text-[12px] font-bold uppercase tracking-[0.25em] text-lime-200">Perfect season odds</div>
          <div className="font-display text-4xl leading-none text-white">
            {formatOdds(odds)}
            {hot && <Flame className="ml-2 inline size-6 -translate-y-0.5 text-orange-400" />}
          </div>
        </div>
        <div>
          <div className="font-cond text-[12px] font-bold uppercase tracking-[0.25em] text-muted-foreground" title="Assumes the rest of your picks are average">
            Projected record
          </div>
          <div className="font-display text-3xl leading-none text-white">
            {Math.round(wins)}–{82 - Math.round(wins)}
          </div>
        </div>
        <div className="min-w-[160px] flex-1">
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-lime-300 transition-all duration-500"
              style={{ width: `${Math.max(3, frac * 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-cond text-[11px] font-semibold uppercase tracking-widest text-white/45">
            <span>Long shot</span>
            <span>82–0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
