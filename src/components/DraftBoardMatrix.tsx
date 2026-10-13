import { getPlayer } from '@/data/players'
import { PROMPT_BY_ID } from '@/data/prompts'
import type { DraftState } from '@/engine/draft'
import { decadeLabel } from '@/engine/pool'
import { cn } from '@/lib/utils'
import { TeamAvatar } from './bits'

export function DraftBoardMatrix({ draft, highlightHumans = true }: { draft: DraftState; highlightHumans?: boolean }) {
  const T = draft.teams.length
  const rounds = draft.settings.rounds
  const cell = (round: number, team: number) => draft.picks.find((p) => p.round === round && p.team === team)
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 scrollbar-thin">
      <table className="w-full border-separate border-spacing-0" style={{ minWidth: 120 + T * 128 }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-[#14102b] px-2 py-2 text-left font-cond text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Rd</th>
            {draft.teams.map((t) => (
              <th key={t.id} className="min-w-[120px] bg-[#14102b] px-2 py-2 text-left" scope="col">
                <div className="flex items-center gap-1.5">
                  <TeamAvatar icon={t.icon} color={t.color} size={22} />
                  <div className="min-w-0">
                    <div className={cn('truncate font-cond text-[13px] font-bold uppercase leading-tight', highlightHumans && t.human ? 'text-primary' : 'text-white')}>
                      {t.owner}
                    </div>
                    <div className="truncate font-cond text-[10.5px] uppercase tracking-wide text-muted-foreground">{t.name}</div>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rounds }, (_, r) => {
            const info = draft.rounds[r]
            const label =
              draft.settings.format === 'ball-knowledge'
                ? PROMPT_BY_ID[info.promptId as string]?.title
                : draft.settings.format === 'time-machine'
                  ? decadeLabel(info.decade ?? 0)
                  : null
            return (
              <tr key={r}>
                <td className="sticky left-0 z-10 border-t border-white/5 bg-[#14102b] px-2 py-1.5 align-top">
                  <div className="font-display text-xl leading-none text-white/80">{r + 1}</div>
                  {label && <div className="max-w-[76px] font-cond text-[9.5px] font-bold uppercase leading-tight tracking-wide text-fuchsia-200">{label}</div>}
                </td>
                {draft.teams.map((_, ti) => {
                  const pk = cell(r, ti)
                  if (!pk) return <td key={ti} className="border-t border-white/5 px-1.5 py-1.5" />
                  const p = getPlayer(pk.playerId)
                  return (
                    <td key={ti} className="border-t border-white/5 px-1.5 py-1.5">
                      <div
                        className={cn('tier-' + p.tier, 'rounded-lg border px-2 py-1')}
                        style={{
                          borderColor: 'color-mix(in oklab, var(--tg) 60%, transparent)',
                          background: 'linear-gradient(135deg, color-mix(in oklab, var(--t2) 28%, #0d0b1d), #0d0b1d)',
                        }}
                        title={`#${pk.overall + 1} · ${p.name} (${p.ovr})${pk.fit !== undefined ? ` · fit ${pk.fit}` : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-cond text-[13px] font-bold uppercase leading-tight text-white">{p.name.split(' ').slice(-1)[0]}</span>
                          <span className="font-display text-[15px] leading-none" style={{ color: 'var(--t1)' }}>
                            {p.ovr}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-cond text-[10px] uppercase tracking-wide text-white/50">
                          <span>{p.pos.join('/')}</span>
                          <span>
                            {pk.fit !== undefined ? `fit ${pk.fit}` : pk.cost !== undefined ? `$${pk.cost}M` : `#${pk.overall + 1}`}
                          </span>
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
