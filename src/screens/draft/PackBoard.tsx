import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlayerCard } from '@/components/PlayerCard'
import { getPlayer } from '@/data/players'
import type { OfferItem } from '@/engine/draft'
import { sfx } from '@/audio/sfx'
import { burst, RAINBOW } from '@/lib/confetti'
import { useMediaQuery } from '@/lib/hooks'

interface Props {
  items: OfferItem[]
  packKey: string
  selectedId: string | null
  onSelect: (id: string) => void
  onConfirm: (id: string) => void
  canAct: boolean
  mulligansLeft: number
  onMulligan: () => void
  teamName: string
}

export function PackBoard({ items, packKey, selectedId, onSelect, onConfirm, canAct, mulligansLeft, onMulligan, teamName }: Props) {
  const [flipped, setFlipped] = useState<boolean[]>(() => items.map(() => !canAct))

  useEffect(() => {
    if (!canAct) {
      setFlipped(items.map(() => true))
      return
    }
    setFlipped(items.map(() => false))
    const timers = items.map((it, i) =>
      setTimeout(() => {
        setFlipped((f) => f.map((v, j) => (j === i ? true : v)))
        const p = getPlayer(it.id)
        if (p.tier === 'galaxy' || p.tier === 'amethyst') {
          sfx.rare()
          burst(RAINBOW, p.tier === 'galaxy' ? 90 : 45, { x: (i + 0.5) / Math.max(items.length, 1), y: 0.5 })
        } else sfx.flip()
      }, 350 + i * 330),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packKey, canAct])

  const isSmall = useMediaQuery('(max-width: 639px)')
  const size = isSmall ? 'sm' : items.length >= 6 ? 'sm' : items.length >= 5 ? 'md' : 'lg'
  const allFlipped = flipped.every(Boolean)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5">
        <div>
          <div className="font-display text-2xl uppercase leading-none text-white">Fresh pack for {teamName}</div>
          <div className="font-cond text-[14px] font-semibold uppercase tracking-wider text-cyan-200">Keep one. The rest go back in the box.</div>
        </div>
        {canAct && (
          <Button
            variant="outline"
            disabled={mulligansLeft <= 0 || !allFlipped}
            onClick={() => {
              sfx.click()
              onMulligan()
            }}
            className="gap-2 border-cyan-300/40 bg-black/20 font-cond text-[14px] font-bold uppercase tracking-wider"
          >
            <RotateCcw className="size-4" />
            Mulligan ({mulligansLeft})
          </Button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-wrap content-start items-start justify-center gap-3 overflow-y-auto p-2 pt-4 scrollbar-thin sm:gap-5">
        {items.map((it, i) => (
          <motion.div key={`${packKey}-${it.id}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <PlayerCard
              player={getPlayer(it.id)}
              size={size}
              faceDown={!flipped[i]}
              selected={selectedId === it.id}
              disabled={!it.ok}
              onClick={flipped[i] ? () => onSelect(it.id) : undefined}
              onDoubleClick={flipped[i] && it.ok && canAct ? () => onConfirm(it.id) : undefined}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
