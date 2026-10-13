import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { OvrBadge, TeamAvatar } from '@/components/bits'
import { PlayerCard } from '@/components/PlayerCard'
import { getPlayer } from '@/data/players'
import type { DraftPick, DraftState } from '@/engine/draft'
import { pickValue } from '@/engine/finale'
import { sfx } from '@/audio/sfx'
import { burst, RAINBOW } from '@/lib/confetti'

export function PickAnnouncement({ draft, quick }: { draft: DraftState; quick: boolean }) {
  const [shown, setShown] = useState<{ pick: DraftPick; key: number } | null>(null)
  const prev = useRef(draft.picks.length)

  useEffect(() => {
    const n = draft.picks.length
    if (n > prev.current) {
      const pick = draft.picks[n - 1]
      const player = getPlayer(pick.playerId)
      const human = draft.teams[pick.team].human
      if (human) sfx.pick()
      else if (!quick) sfx.cpuPick()
      if (player.ovr >= 97 && (human || !quick)) {
        sfx.rare()
        burst(RAINBOW, 70, { x: 0.5, y: 0.35 })
      }
      setShown({ pick, key: n })
    }
    prev.current = n
  }, [draft.picks, draft.teams, quick])

  useEffect(() => {
    if (!shown) return
    const human = draft.teams[shown.pick.team].human
    const ms = human ? 2300 : quick ? 1100 : 1900
    const t = setTimeout(() => setShown(null), ms)
    return () => clearTimeout(t)
  }, [shown, draft.teams, quick])

  const p = shown ? getPlayer(shown.pick.playerId) : null
  const team = shown ? draft.teams[shown.pick.team] : null
  const value = shown && draft.settings.format !== 'pack' && draft.settings.format !== 'ball-knowledge' ? pickValue(draft, shown.pick) : null
  const showCard = !!shown && (draft.teams[shown.pick.team].human || !quick)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[132px] z-40 flex justify-center px-3">
      <AnimatePresence>
        {shown && p && team && (
          <motion.div
            key={shown.key}
            initial={{ opacity: 0, y: -26, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex items-center gap-3 overflow-hidden rounded-2xl border bg-[#14102b]/95 p-2.5 pr-5 shadow-2xl backdrop-blur-md"
            style={{ borderColor: `${team.color}aa`, boxShadow: `0 20px 60px -20px ${team.color}` }}
          >
            {showCard && <PlayerCard player={p} size="sm" tilt={false} />}
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-cond text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: team.color }}>
                <TeamAvatar icon={team.icon} color={team.color} size={22} />
                Pick #{shown.pick.overall + 1}
                {shown.pick.by === 'clock' && <span className="rounded bg-red-500 px-1.5 py-px text-white">Auto</span>}
              </div>
              <div className="truncate font-cond text-[15px] font-semibold uppercase text-white/70">{team.name} select</div>
              <div className="flex items-center gap-2">
                <div className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">{p.name}</div>
                <OvrBadge player={p} />
              </div>
              <div className="mt-0.5 font-cond text-[13px] font-semibold uppercase tracking-wider text-white/60">
                {p.archetype.label} · {p.pos.join('/')}
                {value?.tag === 'steal' && <span className="ml-2 rounded bg-lime-400 px-1.5 py-px font-bold text-black">Steal</span>}
                {value?.tag === 'reach' && <span className="ml-2 rounded bg-orange-500 px-1.5 py-px font-bold text-white">Reach</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
