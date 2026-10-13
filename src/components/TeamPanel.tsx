import { useMemo } from 'react'
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { assignSlots, budgetLeft, rosterOf, slotsFor, type DraftState } from '@/engine/draft'
import { gradeOf, profileOf, type Note } from '@/engine/rating'
import type { Player } from '@/engine/types'
import { OvrBadge, TeamAvatar } from './bits'

const BAR_DEFS: Array<[string, (p: ReturnType<typeof profileOf>) => number]> = [
  ['OFF', (p) => p.offense],
  ['DEF', (p) => p.defense],
  ['SHT', (p) => p.shooting],
  ['PLY', (p) => p.playmaking],
  ['REB', (p) => p.rebounding],
  ['ATH', (p) => p.athleticism],
]

function barColor(v: number) {
  if (v >= 88) return 'linear-gradient(90deg,#a3e635,#22d3ee)'
  if (v >= 78) return 'linear-gradient(90deg,#fbbf24,#ff7a1a)'
  return 'linear-gradient(90deg,#64748b,#94a3b8)'
}

export function NoteChips({ notes, max = 5 }: { notes: Note[]; max?: number }) {
  const sorted = [...notes].sort((a, b) => a.delta - b.delta)
  const worst = sorted.filter((n) => n.delta < 0)
  const best = sorted.filter((n) => n.delta > 0).reverse()
  const shown = [...worst, ...best].slice(0, max)
  if (shown.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((n) => (
        <span
          key={n.label}
          title={n.detail}
          className={cn(
            'rounded-full border px-2 py-0.5 font-cond text-[11.5px] font-bold uppercase tracking-wide',
            n.delta < 0 ? 'border-red-400/40 bg-red-500/15 text-red-300' : 'border-lime-400/40 bg-lime-500/15 text-lime-300',
          )}
        >
          {n.delta < 0 ? '▼' : '▲'} {n.label}
        </span>
      ))}
    </div>
  )
}

export function TeamRating({
  roster,
  bonus = 0,
  bonusLabel,
  needed,
  dense,
  showNotes = true,
}: {
  roster: Player[]
  bonus?: number
  bonusLabel?: string
  needed?: number
  dense?: boolean
  showNotes?: boolean
}) {
  const prof = useMemo(() => profileOf(roster), [roster])
  const power = prof.power + bonus
  const grade = gradeOf(power)
  const building = roster.length < Math.min(5, needed ?? 5)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="grid size-14 shrink-0 place-items-center rounded-xl border border-white/15 font-display text-[34px] leading-none"
          style={{ color: building ? '#9ca3af' : grade.color, background: 'rgb(255 255 255 / 0.05)' }}
        >
          {roster.length === 0 ? '—' : building ? '…' : grade.letter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none text-white">{roster.length === 0 ? '--' : Math.round(power)}</span>
            <span className="font-cond text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Team rating</span>
          </div>
          <div className="truncate font-cond text-[13px] font-semibold uppercase tracking-wide" style={{ color: building ? '#9ca3af' : grade.color }}>
            {roster.length === 0 ? 'Blank slate' : building ? 'Still building' : grade.label}
          </div>
          {bonus !== 0 && bonusLabel && (
            <div className={cn('font-cond text-[11.5px] font-bold uppercase tracking-wide', bonus > 0 ? 'text-lime-300' : 'text-red-300')}>
              {bonusLabel} {bonus > 0 ? '+' : ''}
              {bonus.toFixed(1)}
            </div>
          )}
        </div>
      </div>
      {!dense && roster.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {BAR_DEFS.map(([label, f]) => {
            const v = f(prof)
            return (
              <div key={label} className="flex items-center gap-2">
                <span className="w-7 font-cond text-[11px] font-bold tracking-wider text-muted-foreground">{label}</span>
                <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, v))}%`, background: barColor(v) }} />
                </div>
                <span className="w-6 text-right font-display text-[12px] text-white/90">{Math.round(v)}</span>
              </div>
            )
          })}
        </div>
      )}
      {showNotes && roster.length >= 3 && <NoteChips notes={prof.notes} />}
    </div>
  )
}

export function RosterList({
  state,
  team,
  highlight,
  onPlayer,
}: {
  state: DraftState
  team: number
  highlight?: string
  onPlayer?: (p: Player) => void
}) {
  const roster = rosterOf(state, team)
  const { format, rounds } = state.settings
  const slots = format === 'starting-five' ? slotsFor(rounds) : null
  const assigned = slots ? assignSlots(roster, slots) : null

  const rows: Array<{ label: string; player: Player | null }> = assigned
    ? assigned.map((p, i) => ({ label: slots![i] === 'B' ? 'BN' : slots![i], player: p }))
    : Array.from({ length: rounds }, (_, i) => ({ label: String(i + 1), player: roster[i] ?? null }))

  return (
    <div className="space-y-1">
      {format === 'cap' && (
        <div className="mb-2 rounded-lg border border-violet-400/30 bg-violet-500/10 p-2">
          <div className="flex items-baseline justify-between font-cond text-[12px] font-bold uppercase tracking-wider">
            <span className="text-violet-200">Salary cap</span>
            <span className="text-white">
              ${budgetLeft(state, team)}M left <span className="text-white/50">of ${state.settings.cap}M</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
              style={{ width: `${Math.max(0, Math.min(100, (budgetLeft(state, team) / state.settings.cap) * 100))}%` }}
            />
          </div>
        </div>
      )}
      {rows.map((row, i) => (
        <button
          key={i}
          type="button"
          disabled={!row.player || !onPlayer}
          onClick={() => row.player && onPlayer?.(row.player)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors',
            row.player ? 'border-white/10 bg-white/[0.05] hover:bg-white/[0.1]' : 'border-dashed border-white/15 bg-transparent',
            highlight && row.player?.id === highlight && 'border-primary/70 bg-primary/15',
          )}
        >
          <span className="w-6 shrink-0 text-center font-cond text-[11px] font-bold uppercase tracking-wider text-white/40">{row.label}</span>
          {row.player ? (
            <>
              <OvrBadge player={row.player} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-cond text-[15px] font-bold uppercase leading-tight text-white">{row.player.name}</span>
                <span className="block truncate font-cond text-[11px] font-medium uppercase tracking-wide text-white/50">
                  {row.player.pos.join('/')} · {row.player.archetype.label}
                  {format === 'cap' ? ` · $${row.player.price}M` : ''}
                </span>
              </span>
            </>
          ) : (
            <span className="flex-1 font-cond text-[13px] font-medium uppercase tracking-wider text-white/25">Empty</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function TeamHeader({ team, state, extra }: { team: number; state: DraftState; extra?: React.ReactNode }) {
  const t = state.teams[team]
  return (
    <div className="flex items-center gap-2.5">
      <TeamAvatar icon={t.icon} color={t.color} size={38} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-lg uppercase leading-none text-white">{t.name}</div>
        <div className="truncate font-cond text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t.human ? t.owner : `CPU · ${t.owner}`}
        </div>
      </div>
      {extra}
    </div>
  )
}

export function DeltaPill({ delta }: { delta: number }) {
  const rounded = Math.round(delta * 10) / 10
  if (Math.abs(rounded) < 0.05)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-display text-sm text-white/70">
        <Minus className="size-3" /> 0
      </span>
    )
  const up = rounded > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-sm',
        up ? 'bg-lime-400/20 text-lime-300' : 'bg-red-500/20 text-red-300',
      )}
    >
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {up ? '+' : ''}
      {rounded.toFixed(1)}
    </span>
  )
}

export function ImpactPreview({ roster, player, bonus = 0 }: { roster: Player[]; player: Player; bonus?: number }) {
  const { before, after } = useMemo(() => ({ before: profileOf(roster), after: profileOf([...roster, player]) }), [roster, player])
  const delta = after.power - before.power
  const beforeLabels = new Set(before.notes.map((n) => n.label))
  const afterLabels = new Set(after.notes.map((n) => n.label))
  const fixed = before.notes.filter((n) => n.delta < 0 && !afterLabels.has(n.label))
  const created = after.notes.filter((n) => n.delta < 0 && !beforeLabels.has(n.label))
  const gained = after.notes.filter((n) => n.delta > 0 && !beforeLabels.has(n.label))
  const showNotes = roster.length >= 2
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between">
        <span className="font-cond text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Impact on your team</span>
        <DeltaPill delta={delta} />
      </div>
      <div className="mt-1.5 flex items-center gap-2 font-display text-2xl text-white">
        <span className="text-white/60">{Math.round(before.power + bonus)}</span>
        <ArrowRight className="size-4 text-white/40" />
        <span>{Math.round(after.power + bonus)}</span>
      </div>
      {showNotes && (fixed.length > 0 || created.length > 0 || gained.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {fixed.map((n) => (
            <span key={`f-${n.label}`} className="rounded-full bg-lime-500/15 px-2 py-0.5 font-cond text-[11.5px] font-bold uppercase text-lime-300">
              ✔ Fixes: {n.label}
            </span>
          ))}
          {gained.map((n) => (
            <span key={`g-${n.label}`} className="rounded-full bg-cyan-500/15 px-2 py-0.5 font-cond text-[11.5px] font-bold uppercase text-cyan-200">
              ▲ Adds: {n.label}
            </span>
          ))}
          {created.map((n) => (
            <span key={`c-${n.label}`} className="rounded-full bg-red-500/15 px-2 py-0.5 font-cond text-[11.5px] font-bold uppercase text-red-300">
              ▼ Creates: {n.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
