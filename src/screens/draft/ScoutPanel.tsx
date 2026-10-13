import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Lock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AttrBars, TeamAvatar } from '@/components/bits'
import { PlayerCard } from '@/components/PlayerCard'
import { ImpactPreview, RosterList, TeamHeader, TeamRating, NoteChips } from '@/components/TeamPanel'
import { getPlayer } from '@/data/players'
import { budgetLeft, rosterOf, type DraftState, type OfferItem } from '@/engine/draft'
import { teamBonus } from '@/engine/finale'
import { profileOf } from '@/engine/rating'
import { heightLabel } from '@/engine/types'
import { cn } from '@/lib/utils'
import { topTags } from './helpers'

export type RightTab = 'scout' | 'team'

interface Props {
  draft: DraftState
  selectedId: string | null
  onClockTeam: number
  canAct: boolean
  waitingFor?: string
  offerItem?: OfferItem
  onDraft: (id: string) => void
  viewTeam: number
  setViewTeam: (t: number) => void
  tab: RightTab
  setTab: (t: RightTab) => void
}

export function ScoutPanel({ draft, selectedId, onClockTeam, canAct, waitingFor, offerItem, onDraft, viewTeam, setViewTeam, tab, setTab }: Props) {
  const player = selectedId ? getPlayer(selectedId) : null
  const roster = useMemo(() => rosterOf(draft, onClockTeam), [draft, onClockTeam])
  const bk = draft.settings.format === 'ball-knowledge'
  const cap = draft.settings.format === 'cap'
  const left = cap ? budgetLeft(draft, onClockTeam) : 0
  const needs = useMemo(
    () =>
      profileOf(roster)
        .notes.filter((n) => n.delta < 0)
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 3),
    [roster],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex gap-1 rounded-xl border border-white/10 bg-black/25 p-1" role="tablist">
        {(['scout', 'team'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-lg py-1.5 font-cond text-[14px] font-bold uppercase tracking-wider transition-colors',
              tab === t ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-white',
            )}
          >
            {t === 'scout' ? 'Scouting' : 'Rosters'}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {tab === 'scout' ? (
          <AnimatePresence mode="wait" initial={false}>
            {player ? (
              <motion.div key={player.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 pb-3">
                <div className="flex justify-center pt-1">
                  <PlayerCard player={player} size="lg" tilt={false} tag={cap ? <span className="rounded-full bg-violet-500 px-2 py-px font-display text-[12px] text-white">${player.price}M</span> : undefined} />
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl uppercase leading-none text-white">{player.name}</div>
                  <div className="mt-1 font-cond text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {player.archetype.label} · {player.pos.join('/')} · {heightLabel(player.ht)} · {player.from}–{player.to}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
                    {player.rings > 0 && (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-cond text-[12px] font-bold uppercase text-amber-300">{player.rings}x Champion</span>
                    )}
                    {player.mvps > 0 && (
                      <span className="rounded-full bg-fuchsia-400/15 px-2 py-0.5 font-cond text-[12px] font-bold uppercase text-fuchsia-300">{player.mvps}x MVP</span>
                    )}
                    {!bk &&
                      topTags(player, 4).map((t) => (
                        <span key={t.key} className="rounded-full bg-white/10 px-2 py-0.5 font-cond text-[12px] font-bold uppercase text-white/80">
                          {t.label}
                        </span>
                      ))}
                  </div>
                </div>
                <AttrBars attrs={player.attrs} compact />
                <ImpactPreview roster={roster} player={player} bonus={teamBonus(draft, onClockTeam)} />
                {cap && (
                  <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-2.5 font-cond text-[14px] font-bold uppercase tracking-wide text-violet-100">
                    Costs ${player.price}M · leaves ${left - player.price}M for {draft.settings.rounds - roster.length - 1} more
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                <span className="grid size-14 place-items-center rounded-full border border-dashed border-white/25 text-white/40">
                  <Search className="size-6" />
                </span>
                <div className="font-display text-2xl uppercase text-white/80">Scout a player</div>
                <p className="max-w-[260px] text-sm text-muted-foreground">
                  Select a {draft.settings.format === 'pack' ? 'card' : 'player'} to see his full attributes and exactly how he changes your team rating.
                </p>
                {needs.length > 0 && (
                  <div className="mt-2 w-full rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-left">
                    <div className="mb-1.5 font-cond text-[12px] font-bold uppercase tracking-[0.2em] text-red-200">Your team needs</div>
                    <NoteChips notes={needs} max={3} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="space-y-3 pb-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {draft.teams.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setViewTeam(i)}
                  title={t.name}
                  aria-label={`View ${t.name}`}
                  className={cn('rounded-full p-0.5 transition-all', viewTeam === i ? 'bg-white scale-110' : 'opacity-70 hover:opacity-100')}
                >
                  <TeamAvatar icon={t.icon} color={t.color} size={34} />
                </button>
              ))}
            </div>
            <TeamHeader team={viewTeam} state={draft} />
            <TeamRating
              roster={rosterOf(draft, viewTeam)}
              needed={draft.settings.rounds}
              bonus={teamBonus(draft, viewTeam)}
              bonusLabel="Ball Knowledge"
            />
            <RosterList state={draft} team={viewTeam} />
          </div>
        )}
      </div>

      {tab === 'scout' && (
        <div className="border-t border-white/10 pt-3">
          <Button
            size="lg"
            disabled={!player || !canAct || !(offerItem?.ok ?? false)}
            onClick={() => player && onDraft(player.id)}
            className="h-12 w-full gap-2 font-display text-xl uppercase tracking-wide shadow-[0_0_28px_-8px_var(--primary)]"
          >
            {!player ? (
              'Select a player'
            ) : !canAct ? (
              <>
                <Lock className="size-4" /> {waitingFor ?? 'Waiting…'}
              </>
            ) : offerItem && !offerItem.ok ? (
              <>
                <Lock className="size-4" /> Not eligible
              </>
            ) : (
              <>
                <Check className="size-5" /> Draft {player.name.split(' ').slice(-1)[0]}
              </>
            )}
          </Button>
          {player && canAct && offerItem && !offerItem.ok && <p className="mt-1.5 text-center text-sm text-amber-300">{offerItem.reason}</p>}
        </div>
      )}
    </div>
  )
}
