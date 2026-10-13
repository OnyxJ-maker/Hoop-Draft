import { useMemo, useState } from 'react'
import { OvrBadge, TeamAvatar } from '@/components/bits'
import { getPlayer } from '@/data/players'
import { currentPick, rosterOf, type DraftState } from '@/engine/draft'
import { teamReport } from '@/engine/finale'
import { cn } from '@/lib/utils'

type Tab = 'order' | 'teams' | 'log'

export function OrderRail({ draft, onViewTeam, viewTeam }: { draft: DraftState; onViewTeam: (t: number) => void; viewTeam: number }) {
  const [tab, setTab] = useState<Tab>('order')
  const cur = currentPick(draft)
  const T = draft.teams.length

  const upcoming = useMemo(() => {
    if (!cur) return []
    const out: Array<{ overall: number; team: number; round: number; first: boolean }> = []
    for (let i = cur.overall; i < Math.min(draft.order.length, cur.overall + Math.max(14, T + 2)); i++) {
      const round = Math.floor(i / T)
      out.push({ overall: i, team: draft.order[i], round, first: i % T === 0 || i === cur.overall })
    }
    return out
  }, [cur, draft.order, T])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex gap-1 rounded-xl border border-white/10 bg-black/25 p-1" role="tablist">
        {(['order', 'teams', 'log'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-lg py-1.5 font-cond text-[13.5px] font-bold uppercase tracking-wider transition-colors',
              tab === t ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-white',
            )}
          >
            {t === 'order' ? 'Order' : t === 'teams' ? 'Teams' : 'Log'}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {tab === 'order' && (
          <ol className="space-y-1">
            {upcoming.map((u, idx) => {
              const t = draft.teams[u.team]
              return (
                <li key={u.overall}>
                  {u.first && u.overall % T === 0 && (
                    <div className="mb-1 mt-2 font-cond text-[12px] font-bold uppercase tracking-[0.25em] text-muted-foreground first:mt-0">
                      Round {u.round + 1}
                      {u.round % 2 === 1 ? ' ↺ reversed' : ''}
                    </div>
                  )}
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-2 py-1.5',
                      idx === 0 ? 'border-white/40 bg-white/15' : 'border-white/5 bg-white/[0.04]',
                    )}
                  >
                    <span className="w-8 text-center font-display text-lg leading-none text-white/70">{(u.overall % T) + 1}</span>
                    <TeamAvatar icon={t.icon} color={t.color} size={26} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-cond text-[14.5px] font-bold uppercase leading-tight text-white">{t.name}</span>
                      <span className="block truncate font-cond text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t.human ? t.owner : `CPU · ${t.owner}`}
                      </span>
                    </span>
                    {idx === 0 && <span className="rounded bg-primary px-1.5 py-px font-cond text-[10.5px] font-bold uppercase tracking-widest text-primary-foreground">Now</span>}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        {tab === 'teams' && (
          <ul className="space-y-1.5">
            {draft.teams.map((t, i) => {
              const roster = rosterOf(draft, i)
              const rep = teamReport(draft, i)
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onViewTeam(i)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors',
                      viewTeam === i ? 'border-white/40 bg-white/15' : 'border-white/5 bg-white/[0.04] hover:bg-white/10',
                    )}
                  >
                    <TeamAvatar icon={t.icon} color={t.color} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-cond text-[14.5px] font-bold uppercase leading-tight text-white">{t.name}</span>
                      <span className="block truncate font-cond text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t.owner} · {roster.length}/{draft.settings.rounds}
                      </span>
                    </span>
                    <span className="font-display text-xl leading-none" style={{ color: roster.length >= 3 ? rep.grade.color : '#9ca3af' }}>
                      {roster.length >= 3 ? rep.grade.letter : '–'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {tab === 'log' && (
          <ul className="space-y-1">
            {draft.picks.length === 0 && <li className="p-3 text-sm text-muted-foreground">No picks yet. The first pick is about to be made.</li>}
            {[...draft.picks].reverse().map((pk) => {
              const p = getPlayer(pk.playerId)
              const t = draft.teams[pk.team]
              return (
                <li key={pk.overall} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5">
                  <span className="w-8 text-center font-display text-base leading-none text-white/50">{pk.overall + 1}</span>
                  <TeamAvatar icon={t.icon} color={t.color} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-cond text-[14px] font-bold uppercase leading-tight text-white">{p.name}</span>
                    <span className="block truncate font-cond text-[11px] uppercase tracking-wide text-muted-foreground">{t.name}</span>
                  </span>
                  <OvrBadge player={p} className="h-6 min-w-8 text-[15px]" />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
