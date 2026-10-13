import { History } from 'lucide-react'
import { Coins } from 'lucide-react'
import { getPlayer } from '@/data/players'
import { assignSlots, budgetLeft, rosterOf, slotsFor, type DraftState } from '@/engine/draft'
import { decadeLabel } from '@/engine/pool'
import { cn } from '@/lib/utils'

export function DecadeBanner({ decade, count }: { decade: number; count: number }) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-xl border border-amber-300/40 bg-gradient-to-r from-amber-300/20 to-transparent px-4 py-2">
      <History className="size-6 text-amber-300" />
      <div>
        <div className="font-display text-2xl uppercase leading-none text-white">The {decadeLabel(decade)}</div>
        <div className="font-cond text-[13px] font-semibold uppercase tracking-wider text-amber-200">
          Only players who peaked in this era · {count} eligible
        </div>
      </div>
    </div>
  )
}

export function CapBanner({ draft, team }: { draft: DraftState; team: number }) {
  const cap = draft.settings.cap
  const left = budgetLeft(draft, team)
  const slotsLeft = draft.settings.rounds - draft.rosters[team].length
  const perPick = slotsLeft > 0 ? left / slotsLeft : 0
  const frac = Math.max(0, Math.min(1, left / cap))
  return (
    <div className="mb-2 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-500/20 to-transparent px-4 py-2">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <div className="flex items-center gap-2">
          <Coins className="size-6 text-violet-300" />
          <div>
            <div className="font-display text-2xl uppercase leading-none text-white">
              ${left}M <span className="text-base text-white/50">of ${cap}M left</span>
            </div>
            <div className="font-cond text-[13px] font-semibold uppercase tracking-wider text-violet-200">
              {slotsLeft} spot{slotsLeft === 1 ? '' : 's'} to fill · about ${perPick.toFixed(1)}M per pick
            </div>
          </div>
        </div>
        <div className="min-w-[140px] flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all" style={{ width: `${frac * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SlotStrip({ draft, team, selectedId }: { draft: DraftState; team: number; selectedId: string | null }) {
  const slots = slotsFor(draft.settings.rounds)
  const roster = rosterOf(draft, team)
  const assigned = assignSlots(roster, slots) ?? slots.map(() => null)
  const preview = selectedId ? assignSlots([...roster, getPlayer(selectedId)], slots) : null
  const incoming = selectedId ? getPlayer(selectedId) : null
  return (
    <div className="mb-2 rounded-xl border border-lime-300/30 bg-lime-300/5 p-2">
      <div className="mb-1.5 font-cond text-[12px] font-bold uppercase tracking-[0.25em] text-lime-200">
        {draft.teams[team].owner}&apos;s lineup {incoming && <span className="text-white/50">· {incoming.name} would slot in highlighted</span>}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {slots.map((slot, i) => {
          const p = assigned[i]
          const newlyFilled = !!preview && !!incoming && preview[i]?.id === incoming.id && assigned[i]?.id !== incoming.id
          return (
            <div
              key={i}
              className={cn(
                'min-w-[84px] flex-1 rounded-lg border px-2 py-1 text-center',
                p ? 'border-white/20 bg-white/10' : 'border-dashed border-white/20',
                newlyFilled && 'border-lime-300 bg-lime-300/25 shadow-[0_0_14px_-2px_#bef264]',
              )}
            >
              <div className="font-cond text-[11px] font-bold uppercase tracking-widest text-lime-200">{slot === 'B' ? 'BENCH' : slot}</div>
              <div className="truncate font-cond text-[13px] font-bold uppercase leading-tight text-white">
                {p ? p.name.split(' ').slice(-1)[0] : newlyFilled && incoming ? incoming.name.split(' ').slice(-1)[0] : <span className="text-white/25">open</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
