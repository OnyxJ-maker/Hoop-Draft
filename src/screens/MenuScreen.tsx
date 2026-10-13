import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, BookOpen, History, Play, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/Icon'
import { Logo } from '@/components/bits'
import { SoundToggle } from '@/components/AppBar'
import { PlayerCard } from '@/components/PlayerCard'
import { getPlayer } from '@/data/players'
import { FORMATS, FORMAT_ORDER } from '@/engine/formats'
import { sfx } from '@/audio/sfx'
import { useGame } from '@/store/game'
import { HowToPlay } from './HowToPlay'

const HERO = ['stephen-curry', 'michael-jordan', 'lebron-james']

function PerfectGrid() {
  return (
    <div className="grid grid-cols-[repeat(41,minmax(0,1fr))] gap-[3px]" aria-hidden="true">
      {Array.from({ length: 82 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.012, type: 'spring', stiffness: 400, damping: 18 }}
          className="aspect-square rounded-[3px] bg-lime-400 shadow-[0_0_8px_-1px_#a3e635]"
        />
      ))}
    </div>
  )
}

export function MenuScreen() {
  const pickMode = useGame((s) => s.pickMode)
  const goto = useGame((s) => s.goto)
  const resume = useGame((s) => s.resume)
  const hasGame = useGame((s) => !!s.draft && !!s.resumeScreen)
  const draftInfo = useGame((s) => (s.draft ? `${FORMATS[s.draft.settings.format].name} · ${s.draft.picks.length}/${s.draft.order.length} picks` : ''))
  const [howTo, setHowTo] = useState(false)

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" className="gap-2 text-white/80 hover:text-white" onClick={() => setHowTo(true)}>
          <BookOpen className="size-4" />
          <span className="font-cond text-[14px] font-bold uppercase tracking-wider">How to play</span>
        </Button>
        <Button variant="ghost" className="gap-2 text-white/80 hover:text-white" onClick={() => goto('hof')}>
          <Trophy className="size-4" />
          <span className="font-cond text-[14px] font-bold uppercase tracking-wider">Hall of Fame</span>
        </Button>
        <SoundToggle />
      </div>

      <div className="mt-4 grid items-center gap-8 lg:mt-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <Logo size="lg" />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-5 max-w-xl font-cond text-2xl font-semibold uppercase leading-tight tracking-wide text-white/90 sm:text-3xl"
          >
            Draft the squad. Settle the debate.
            <span className="mt-2 block text-base font-medium normal-case tracking-normal text-muted-foreground sm:text-lg">
              Pass-and-play with as many friends as you want, or go solo against CPU GMs. Seven decades of hoopers, one screen.
            </span>
          </motion.p>
        </div>
        <div className="relative hidden h-[330px] lg:block" aria-hidden="true">
          {HERO.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: (i - 1) * 11 }}
              transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 160, damping: 16 }}
              className="absolute top-2"
              style={{ left: `${6 + i * 29}%`, zIndex: i === 1 ? 3 : 2 }}
            >
              <PlayerCard player={getPlayer(id)} size="lg" tilt={false} />
            </motion.div>
          ))}
        </div>
      </div>

      {hasGame && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            sfx.select()
            resume()
          }}
          className="glass mt-8 flex items-center gap-4 rounded-2xl border-primary/40 p-4 text-left transition-colors hover:bg-white/10"
        >
          <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <Play className="size-6 fill-current" />
          </span>
          <span className="flex-1">
            <span className="block font-display text-2xl uppercase text-white">Resume your game</span>
            <span className="block font-cond text-sm font-semibold uppercase tracking-wider text-muted-foreground">{draftInfo}</span>
          </span>
          <ArrowRight className="size-6 text-primary" />
        </motion.button>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <motion.button
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            sfx.select()
            pickMode('season82')
          }}
          className="group relative overflow-hidden rounded-3xl border border-lime-300/30 bg-gradient-to-br from-[#16301a] via-[#101a2e] to-[#0d0b1d] p-6 text-left shadow-[0_20px_60px_-25px_#a3e635] transition-shadow hover:shadow-[0_24px_70px_-20px_#a3e635]"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-cond text-sm font-bold uppercase tracking-[0.3em] text-lime-300">Game mode</div>
              <div className="font-display text-[84px] leading-[0.9] text-white sm:text-[104px]">
                82<span className="text-lime-300">–</span>0
              </div>
            </div>
            <span className="grid size-12 place-items-center rounded-full bg-lime-300 text-black transition-transform group-hover:translate-x-1">
              <ArrowRight className="size-6" />
            </span>
          </div>
          <p className="mt-1 max-w-md text-[15px] leading-relaxed text-white/80">
            Draft a super team, then sim a full 82-game season. Anything less than perfect is a failure. Watch your Perfect Season Odds climb as you build.
          </p>
          <div className="mt-5">
            <PerfectGrid />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            sfx.select()
            pickMode('draft')
          }}
          className="group relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-[#3a1b0c] via-[#1d1030] to-[#0d0b1d] p-6 text-left shadow-[0_20px_60px_-25px_#ff7a1a] transition-shadow hover:shadow-[0_24px_70px_-20px_#ff7a1a]"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-cond text-sm font-bold uppercase tracking-[0.3em] text-primary">Game modes inside</div>
              <div className="font-display text-[64px] uppercase leading-[0.92] text-white sm:text-[80px]">
                Draft
                <br />
                Night
              </div>
            </div>
            <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-1">
              <ArrowRight className="size-6" />
            </span>
          </div>
          <p className="mt-1 max-w-md text-[15px] leading-relaxed text-white/80">
            Snake drafts, Ball Knowledge prompts, pack rips, positional lineups, decade rounds and salary caps. Then a league season and playoffs crown a champion.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {FORMAT_ORDER.map((id) => {
              const f = FORMATS[id]
              return (
                <span
                  key={id}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 font-cond text-[13px] font-bold uppercase tracking-wide"
                  style={{ borderColor: `${f.accent}66`, color: f.accent, background: `${f.accent}1a` }}
                >
                  <Icon name={f.icon} className="size-3.5" />
                  {f.name}
                </span>
              )
            })}
          </div>
        </motion.button>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-10 font-cond text-[13px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="flex items-center gap-2">
          <History className="size-4" /> Ratings are peak-career and through the 2024-25 season
        </span>
        <span>Local multiplayer · Solo vs CPU · No sign-up</span>
      </div>

      <HowToPlay open={howTo} onOpenChange={setHowTo} />
    </div>
  )
}
