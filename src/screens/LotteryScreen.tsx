import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FastForward, Play } from 'lucide-react'
import { AppBar } from '@/components/AppBar'
import { BasketballIcon } from '@/components/BasketballIcon'
import { TeamAvatar } from '@/components/bits'
import { Button } from '@/components/ui/button'
import { FORMATS } from '@/engine/formats'
import { sfx } from '@/audio/sfx'
import { burst } from '@/lib/confetti'
import { useGame } from '@/store/game'
import { cn } from '@/lib/utils'

export function LotteryScreen() {
  const draft = useGame((s) => s.draft)
  const beginDraft = useGame((s) => s.beginDraft)
  const [revealed, setRevealed] = useState(0)
  const [spin, setSpin] = useState(0)
  const T = draft?.teams.length ?? 0
  const done = revealed >= T

  useEffect(() => {
    if (!draft || done) return
    const spinTimer = setInterval(() => setSpin((s) => s + 1), 70)
    const timer = setTimeout(
      () => {
        setRevealed((r) => r + 1)
        sfx.flip()
      },
      T > 10 ? 480 : 750,
    )
    return () => {
      clearInterval(spinTimer)
      clearTimeout(timer)
    }
  }, [draft, done, revealed, T])

  useEffect(() => {
    if (done && T > 0) {
      sfx.fanfare()
      burst(undefined, 70, { x: 0.5, y: 0.35 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (T > 0) {
      document.getElementById(`slot-${T - revealed - 1}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [done, T, revealed])

  if (!draft) return null
  const f = FORMATS[draft.settings.format]
  const order = draft.order.slice(0, T)

  return (
    <div className="min-h-screen pb-28">
      <AppBar title="Draft Lottery" />
      <main className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <div className="mb-6 text-center">
          <motion.div
            animate={done ? { rotate: 0 } : { rotate: 360 }}
            transition={done ? undefined : { repeat: Infinity, ease: 'linear', duration: 1.2 }}
            className="mx-auto mb-3 w-fit text-primary"
          >
            <BasketballIcon size={54} />
          </motion.div>
          <h1 className="font-display text-5xl uppercase leading-none text-white sm:text-6xl">
            {done ? 'The order is set' : 'Drawing the order…'}
          </h1>
          <p className="mt-2 font-cond text-lg font-semibold uppercase tracking-wider text-muted-foreground">
            {f.name} · {draft.settings.rounds} rounds · {T} teams · pick order snakes every round
          </p>
        </div>

        <ol className="space-y-2">
          {order.map((teamIdx, i) => {
            const isRevealed = i >= T - revealed
            const isSpinning = !done && i === T - revealed - 1
            const shown = isRevealed ? teamIdx : isSpinning ? (spin + i) % T : null
            const team = shown === null ? null : draft.teams[shown]
            return (
              <motion.li
                key={i}
                id={`slot-${i}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.03 }}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors',
                  isRevealed ? 'border-white/20 bg-white/[0.07]' : 'border-dashed border-white/15 bg-black/20',
                  isRevealed && team?.human && 'border-primary/50 bg-primary/10',
                )}
              >
                <span className="w-14 text-center font-display text-3xl leading-none text-white/90">#{i + 1}</span>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {team ? (
                    <TeamAvatar icon={team.icon} color={team.color} size={44} className={cn(isSpinning && 'opacity-60 blur-[0.5px]')} />
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full border border-dashed border-white/20 font-display text-xl text-white/30">?</span>
                  )}
                  <div className="min-w-0">
                    <div className={cn('truncate font-display text-2xl uppercase leading-none', isRevealed ? 'text-white' : 'text-white/40')}>
                      {team ? team.name : '???'}
                    </div>
                    <div className="truncate font-cond text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {team ? (team.human ? team.owner : `CPU · ${team.owner}`) : 'Waiting…'}
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {isRevealed && team?.human && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full bg-primary px-2.5 py-0.5 font-cond text-[12px] font-bold uppercase tracking-widest text-primary-foreground"
                    >
                      You
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </ol>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0b1d]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 px-4 py-3">
          {!done && (
            <Button variant="outline" className="gap-2 border-white/20 bg-transparent" onClick={() => setRevealed(T)}>
              <FastForward className="size-4" /> Skip
            </Button>
          )}
          <Button
            size="lg"
            disabled={!done}
            onClick={() => {
              sfx.whistle()
              beginDraft()
            }}
            className="h-12 gap-2 px-8 font-display text-xl uppercase tracking-wide"
          >
            <Play className="size-5 fill-current" /> Start the draft
          </Button>
        </div>
      </div>
    </div>
  )
}
