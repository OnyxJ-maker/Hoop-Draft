import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Icon } from '@/components/Icon'
import { PlayerCard } from '@/components/PlayerCard'
import { TeamAvatar } from '@/components/bits'
import { getPlayer } from '@/data/players'
import { PROMPT_BY_ID } from '@/data/prompts'
import { currentPick, type DraftState } from '@/engine/draft'

interface Props {
  draft: DraftState
  selectedId: string | null
  onSelect: (id: string) => void
  onConfirm: (id: string) => void
  canAct: boolean
}

export function PoolBoard({ draft, selectedId, onSelect, onConfirm, canAct }: Props) {
  const cur = currentPick(draft)
  const round = cur?.round ?? Math.max(0, draft.settings.rounds - 1)
  const info = draft.rounds[round]
  const prompt = PROMPT_BY_ID[info.promptId as string]
  const pool = info.pool ?? []
  const takenBy = useMemo(() => {
    const m = new Map<string, number>()
    draft.picks.filter((p) => p.round === round).forEach((p) => m.set(p.playerId, p.team))
    return m
  }, [draft.picks, round])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 overflow-hidden rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-500/25 via-violet-500/15 to-transparent px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-fuchsia-500 text-white shadow-[0_0_30px_-4px_#d946ef]">
            <Icon name={prompt?.icon ?? 'Star'} className="size-7" strokeWidth={2.3} />
          </span>
          <div className="min-w-0">
            <div className="font-cond text-[13px] font-bold uppercase tracking-[0.25em] text-fuchsia-200">
              Round {round + 1} of {draft.settings.rounds} · Who fits this prompt best?
            </div>
            <div className="font-display text-3xl uppercase leading-[1.02] text-white sm:text-4xl">{prompt?.title}</div>
            <div className="font-cond text-[15px] font-medium text-white/70">{prompt?.tagline}</div>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex flex-wrap justify-center gap-4 p-2 pt-4">
          {pool.map((id, i) => {
            const p = getPlayer(id)
            const by = takenBy.get(id)
            const team = by !== undefined ? draft.teams[by] : null
            return (
              <motion.div key={id} initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <PlayerCard
                  player={p}
                  size="md"
                  selected={selectedId === id}
                  disabled={!!team}
                  hideStats={false}
                  onClick={team ? undefined : () => onSelect(id)}
                  onDoubleClick={team || !canAct ? undefined : () => onConfirm(id)}
                  footer={
                    team ? (
                      <div className="flex flex-col items-center gap-1">
                        <TeamAvatar icon={team.icon} color={team.color} size={30} />
                        <span className="font-cond text-[11px] font-bold uppercase tracking-wider text-white">Drafted by {team.owner}</span>
                      </div>
                    ) : undefined
                  }
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
