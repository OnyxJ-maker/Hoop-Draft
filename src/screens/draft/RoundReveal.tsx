import { useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/Icon'
import { OvrBadge, TeamAvatar } from '@/components/bits'
import { PROMPT_BY_ID, VERDICT_LABEL, VERDICT_LINES, verdictOf, type FitVerdict } from '@/data/prompts'
import { getPlayer } from '@/data/players'
import { currentPick, type DraftState } from '@/engine/draft'
import { bkRoundRanking } from '@/engine/finale'
import { sfx } from '@/audio/sfx'
import { burst, GOLD } from '@/lib/confetti'
import { cn } from '@/lib/utils'

const VERDICT_STYLE: Record<FitVerdict, string> = {
  perfect: 'bg-lime-400 text-black',
  strong: 'bg-cyan-400 text-black',
  solid: 'bg-amber-300 text-black',
  weak: 'bg-orange-500 text-white',
  whiff: 'bg-red-500 text-white',
}

export function RoundReveal({ draft, onNext }: { draft: DraftState; onNext: () => void }) {
  const cur = currentPick(draft)
  const round = cur ? cur.round - 1 : draft.settings.rounds - 1
  const info = draft.rounds[round]
  const prompt = PROMPT_BY_ID[info.promptId as string]
  const ranking = bkRoundRanking(draft, round)
  const picks = draft.picks.filter((p) => p.round === round)
  const last = round >= draft.settings.rounds - 1
  const bestPickFit = Math.max(...picks.map((p) => p.fit ?? 0))

  useEffect(() => {
    sfx.fanfare()
    if (bestPickFit >= 85) burst(GOLD, 70, { x: 0.5, y: 0.3 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNext])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Round results"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#07050f]/94 p-3 backdrop-blur-md sm:p-6"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-fuchsia-500 text-white shadow-[0_0_30px_-4px_#d946ef]">
            <Icon name={prompt.icon} className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-cond text-[13px] font-bold uppercase tracking-[0.3em] text-fuchsia-200">Round {round + 1} results · the official ruling</div>
            <div className="font-display text-3xl uppercase leading-none text-white sm:text-5xl">{prompt.title}</div>
          </div>
          <Button size="lg" onClick={onNext} className="hidden h-12 gap-2 px-6 font-display text-xl uppercase sm:inline-flex">
            {last ? 'See the teams' : 'Next round'} <ArrowRight className="size-5" />
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="glass rounded-2xl p-3 sm:p-4">
            <h3 className="mb-2 flex items-center gap-2 font-display text-xl uppercase text-white">
              <Trophy className="size-5 text-amber-300" /> Official ranking
            </h3>
            <ol className="space-y-1.5">
              {ranking.map((r, i) => {
                const team = r.pick ? draft.teams[r.pick.team] : null
                const fact = prompt.fact?.(r.player)
                return (
                  <motion.li
                    key={r.player.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i }}
                    className={cn('relative flex items-center gap-2.5 overflow-hidden rounded-xl border px-2.5 py-2', i === 0 ? 'border-amber-300/60 bg-amber-300/10' : 'border-white/10 bg-white/[0.04]')}
                  >
                    <span className="w-6 text-center font-display text-xl text-white/60">{i + 1}</span>
                    <OvrBadge player={r.player} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-cond text-[16px] font-bold uppercase leading-tight text-white">{r.player.name}</span>
                        {fact && <span className="shrink-0 font-cond text-[12px] font-semibold uppercase text-amber-200">{fact}</span>}
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, r.fit)}%` }}
                          transition={{ delay: 0.1 + 0.08 * i, duration: 0.6 }}
                          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-300"
                        />
                      </div>
                    </div>
                    <span className="w-9 text-right font-display text-xl text-white">{r.fit}</span>
                    {team ? (
                      <span title={`${team.owner} picked him`}>
                        <TeamAvatar icon={team.icon} color={team.color} size={28} />
                      </span>
                    ) : (
                      <span className="size-7" />
                    )}
                  </motion.li>
                )
              })}
            </ol>
          </section>

          <section className="glass rounded-2xl p-3 sm:p-4">
            <h3 className="mb-2 font-display text-xl uppercase text-white">Everybody&apos;s read</h3>
            <ul className="space-y-2">
              {picks.map((pk, i) => {
                const t = draft.teams[pk.team]
                const p = getPlayer(pk.playerId)
                const verdict = verdictOf(pk.fit ?? 0)
                const lines = VERDICT_LINES[verdict]
                const quip = lines[(pk.overall + round) % lines.length]
                return (
                  <motion.li
                    key={pk.overall}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + 0.08 * i }}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <TeamAvatar icon={t.icon} color={t.color} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-cond text-[15px] font-bold uppercase leading-tight text-white">
                          {t.owner} <span className="text-white/45">picked</span> {p.name}
                        </div>
                        <div className="font-cond text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Best available was {pk.bestFit} · you got {pk.fit}
                        </div>
                      </div>
                      <span className={cn('rounded-md px-2 py-0.5 font-display text-[13px] uppercase tracking-wide', VERDICT_STYLE[verdict])}>
                        {VERDICT_LABEL[verdict]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[14px] italic text-white/70">“{quip}”</p>
                  </motion.li>
                )
              })}
            </ul>
          </section>
        </div>

        <div className="sticky bottom-3 mt-4 flex justify-center sm:hidden">
          <Button size="lg" onClick={onNext} className="h-12 gap-2 px-8 font-display text-xl uppercase shadow-xl">
            {last ? 'See the teams' : 'Next round'} <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
