import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TeamAvatar } from '@/components/bits'
import { currentPick, type DraftState } from '@/engine/draft'
import { sfx } from '@/audio/sfx'

/** Hot-seat helper: a quick "you're up" flash when the device should change hands. */
export function TurnSplash({ draft, quick }: { draft: DraftState; quick: boolean }) {
  const [team, setTeam] = useState<number | null>(null)
  const prevHuman = useRef<number | null>(null)
  const humans = draft.teams.filter((t) => t.human).length
  const cur = currentPick(draft)
  const turnKey = cur && draft.phase === 'pick' ? cur.overall : -1

  useEffect(() => {
    if (humans < 2 || !cur || draft.phase !== 'pick') return
    const t = draft.teams[cur.team]
    if (!t.human) return
    if (prevHuman.current !== cur.team) {
      prevHuman.current = cur.team
      if (!quick) {
        setTeam(cur.team)
        sfx.whistle()
        const id = setTimeout(() => setTeam(null), 1250)
        return () => clearTimeout(id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey, humans, quick])

  const t = team !== null ? draft.teams[team] : null
  return (
    <AnimatePresence>
      {t && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[45] grid place-items-center"
          style={{ background: `radial-gradient(70% 55% at 50% 50%, ${t.color}55, rgb(7 5 15 / 0.82))` }}
        >
          <motion.div initial={{ scale: 0.6, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 15 }} className="text-center">
            <TeamAvatar icon={t.icon} color={t.color} size={96} ring className="mx-auto" />
            <div className="mt-4 font-display text-6xl uppercase leading-none text-white sm:text-8xl" style={{ textShadow: `0 0 50px ${t.color}` }}>
              {t.owner}
            </div>
            <div className="mt-2 font-cond text-2xl font-bold uppercase tracking-[0.4em]" style={{ color: t.color }}>
              You&apos;re up
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
