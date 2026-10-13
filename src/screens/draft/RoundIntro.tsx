import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/Icon'
import { PROMPT_BY_ID } from '@/data/prompts'
import { currentPick, type DraftState } from '@/engine/draft'
import { decadeLabel } from '@/engine/pool'
import { sfx } from '@/audio/sfx'

export function RoundIntro({ draft, onGo }: { draft: DraftState; onGo: () => void }) {
  const cur = currentPick(draft)
  const round = cur?.round ?? 0
  const info = draft.rounds[round]
  const bk = draft.settings.format === 'ball-knowledge'
  const prompt = bk ? PROMPT_BY_ID[info.promptId as string] : null
  const hasHuman = draft.teams.some((t) => t.human)

  useEffect(() => {
    sfx.whistle()
    if (hasHuman) return
    const t = setTimeout(onGo, 2400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onGo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onGo])

  const accent = bk ? '#f43f9d' : '#fbbf24'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={bk ? prompt?.title : `Round ${round + 1}`}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#07050f]/92 p-6 backdrop-blur-md"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: `radial-gradient(60% 50% at 50% 45%, ${accent}40, transparent 70%)` }}
      />
      <motion.div
        initial={{ scale: 0.8, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="relative max-w-3xl text-center"
      >
        <div className="font-cond text-lg font-bold uppercase tracking-[0.4em]" style={{ color: accent }}>
          Round {round + 1} of {draft.settings.rounds}
        </div>
        <motion.div
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 14 }}
          className="mx-auto mt-5 grid size-24 place-items-center rounded-3xl text-white"
          style={{ background: accent, boxShadow: `0 0 70px -8px ${accent}` }}
        >
          <Icon name={bk ? (prompt?.icon ?? 'Star') : 'History'} className="size-12" strokeWidth={2.2} />
        </motion.div>
        <h2 className="mt-6 font-display text-5xl uppercase leading-[0.98] text-white sm:text-7xl">
          {bk ? prompt?.title : `The ${decadeLabel(info.decade ?? 1990)}`}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-xl text-white/75">
          {bk
            ? prompt?.tagline
            : 'Only players whose prime overlapped this decade are on the board. Pick the best one you can find.'}
        </p>
        {bk && (
          <p className="mx-auto mt-3 max-w-lg font-cond text-base font-semibold uppercase tracking-wider text-white/50">
            Everyone picks from the same pool. Your read gets scored when the round ends.
          </p>
        )}
        <Button
          size="lg"
          onClick={onGo}
          className="mt-8 h-14 gap-2 px-10 font-display text-2xl uppercase tracking-wide"
          style={{ background: accent, color: '#120d1f' }}
        >
          <Play className="size-5 fill-current" /> {hasHuman ? "Let's go" : 'Starting…'}
        </Button>
      </motion.div>
    </motion.div>
  )
}
