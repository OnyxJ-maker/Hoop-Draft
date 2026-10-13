import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Pause, Play, SkipForward, StepForward } from 'lucide-react'
import { TeamAvatar } from '@/components/bits'
import { Panel, Segmented } from '@/components/controls'
import { Button } from '@/components/ui/button'
import type { LTeam, PlayoffResult, Series } from '@/engine/league'
import { statLine, topPerformer } from '@/engine/stats'
import { sfx } from '@/audio/sfx'
import { cn } from '@/lib/utils'
import { roundName } from './util'

interface Step {
  round: number
  slot: number
  game: number
}

export function PlayoffsStage({ teams, playoffs, onDone }: { teams: LTeam[]; playoffs: PlayoffResult; onDone: () => void }) {
  const { rounds, seeds } = playoffs
  const steps = useMemo(() => {
    const out: Step[] = []
    rounds.forEach((series, r) => series.forEach((s, sl) => s.games.forEach((_, gi) => out.push({ round: r, slot: sl, game: gi }))))
    return out
  }, [rounds])
  const startIndex = useMemo(() => {
    const map = new Map<string, number>()
    steps.forEach((st, i) => {
      const key = `${st.round}-${st.slot}`
      if (!map.has(key)) map.set(key, i)
    })
    return map
  }, [steps])

  const [pointer, setPointer] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState<1 | 4 | 16>(1)
  const done = pointer >= steps.length
  const active = running && !done

  useEffect(() => {
    const t = setTimeout(() => setRunning(true), 900)
    return () => clearTimeout(t)
  }, [])

  const nextStep = steps[pointer]
  const isFinals = nextStep ? nextStep.round === rounds.length - 1 : true

  useEffect(() => {
    if (!active) return
    const base = speed === 1 ? (isFinals ? 2300 : 1500) : speed === 4 ? 420 : 55
    const t = setTimeout(() => {
      const st = steps[pointer]
      setPointer((p) => p + 1)
      const series = rounds[st.round][st.slot]
      const game = series.games[st.game]
      const winner = game.hs > game.as ? game.home : game.away
      const wins = series.games.slice(0, st.game + 1).filter((g) => (g.hs > g.as ? g.home : g.away) === winner).length
      const clinched = wins >= Math.floor(series.bestOf / 2) + 1
      if (speed === 1) {
        if (clinched) sfx.whistle()
        else sfx.swish()
      }
    }, base)
    return () => clearTimeout(t)
  }, [active, pointer, speed, steps, rounds, isFinals])

  const seriesState = (s: Series) => {
    const start = startIndex.get(`${s.round}-${s.slot}`) ?? 0
    const shown = Math.max(0, Math.min(s.games.length, pointer - start))
    let hw = 0
    let lw = 0
    for (let i = 0; i < shown; i++) {
      const g = s.games[i]
      const w = g.hs > g.as ? g.home : g.away
      if (w === s.high) hw++
      else lw++
    }
    return { shown, hw, lw, complete: shown === s.games.length, started: shown > 0 }
  }

  const teamAt = (round: number, slot: number, side: 0 | 1): number | null => {
    if (round === 0) {
      const s = rounds[0][slot]
      return side === 0 ? s.high : s.low
    }
    const feeder = rounds[round - 1][slot * 2 + side]
    const st = seriesState(feeder)
    return st.complete ? feeder.winner : null
  }

  const latest = pointer > 0 ? steps[pointer - 1] : null
  const latestSeries = latest ? rounds[latest.round][latest.slot] : null
  const latestGame = latest && latestSeries ? latestSeries.games[latest.game] : null
  const latestState = latestSeries ? seriesState(latestSeries) : null

  const skipSeries = () => {
    const st = steps[pointer]
    if (!st) return
    const s = rounds[st.round][st.slot]
    const start = startIndex.get(`${st.round}-${st.slot}`) ?? 0
    setPointer(start + s.games.length)
  }

  const champion = playoffs.champion

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-3 pb-28 pt-4 sm:px-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title="Playoff bracket">
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin">
            {rounds.map((series, r) => (
              <div key={r} className="flex min-w-[230px] flex-1 flex-col">
                <div className="mb-2 font-cond text-[13px] font-bold uppercase tracking-[0.25em] text-primary">{roundName(r, rounds.length)}</div>
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {series.map((s, sl) => {
                    const st = seriesState(s)
                    const a = teamAt(r, sl, 0)
                    const b = teamAt(r, sl, 1)
                    const live = latest && latest.round === r && latest.slot === sl && !st.complete
                    return (
                      <div
                        key={sl}
                        className={cn(
                          'rounded-xl border p-2 transition-colors',
                          live ? 'border-primary bg-primary/10' : st.complete ? 'border-white/20 bg-white/[0.07]' : 'border-white/10 bg-white/[0.03]',
                        )}
                      >
                        {[a, b].map((tid, side) => {
                          if (tid === null) {
                            return (
                              <div key={side} className="flex items-center gap-2 px-1 py-1 font-cond text-[14px] font-semibold uppercase text-white/30">
                                <span className="size-7 rounded-full border border-dashed border-white/20" /> To be decided
                              </div>
                            )
                          }
                          const t = teams[tid]
                          const wins = tid === s.high ? st.hw : st.lw
                          const won = st.complete && s.winner === tid
                          const lost = st.complete && s.winner !== tid
                          return (
                            <div key={side} className={cn('flex items-center gap-2 rounded-lg px-1 py-1', won && 'bg-lime-400/15', lost && 'opacity-45')}>
                              <span className="w-4 text-center font-display text-sm text-white/40">{seeds.indexOf(tid) + 1}</span>
                              <TeamAvatar icon={t.icon} color={t.color} size={26} />
                              <span className="min-w-0 flex-1 truncate font-cond text-[15px] font-bold uppercase text-white">{t.name}</span>
                              <span className={cn('font-display text-xl', won ? 'text-lime-300' : 'text-white')}>{wins}</span>
                            </div>
                          )
                        })}
                        <div className="mt-1 px-1 text-right font-cond text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Best of {s.bestOf}
                          {st.complete && ` · ${teams[s.winner].name.split(' ').slice(-1)[0]} in ${s.games.length}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={latestSeries ? roundName(latestSeries.round, rounds.length) : 'Opening tip'}>
          {latestGame && latestSeries && latest && latestState ? (
            <motion.div key={pointer} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="font-cond text-[13px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Game {latest.game + 1} · Series {teams[latestSeries.high].name.split(' ').slice(-1)[0]} {latestState.hw}, {teams[latestSeries.low].name.split(' ').slice(-1)[0]}{' '}
                {latestState.lw}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-3">
                {[latestGame.away, latestGame.home].map((tid, i) => {
                  const t = teams[tid]
                  const score = i === 0 ? latestGame.as : latestGame.hs
                  const won = i === 0 ? latestGame.as > latestGame.hs : latestGame.hs > latestGame.as
                  return (
                    <div key={i} className={cn('text-center', i === 1 && 'order-3', !won && 'opacity-60')}>
                      <TeamAvatar icon={t.icon} color={t.color} size={48} className="mx-auto" />
                      <div className="mt-1 truncate font-cond text-[15px] font-bold uppercase text-white">{t.name}</div>
                      <div className={cn('font-display text-5xl leading-none', won ? 'text-white' : 'text-white/70')}>{score}</div>
                    </div>
                  )
                })}
                <div className="order-2 text-center font-cond text-sm font-bold uppercase tracking-widest text-white/40">
                  @{latestGame.ot && <div className="text-amber-300">OT</div>}
                </div>
              </div>
              <ul className="space-y-1.5">
                {[latestGame.away, latestGame.home].map((tid, i) => {
                  const star = topPerformer(i === 0 ? latestGame.awayBox : latestGame.homeBox)
                  if (!star) return null
                  return (
                    <li key={tid} className="rounded-lg bg-white/[0.05] px-2.5 py-1.5">
                      <div className="font-cond text-[12px] font-bold uppercase tracking-widest text-muted-foreground">{teams[tid].name}</div>
                      <div className="font-cond text-[15px] font-bold uppercase text-white">
                        {star.name} <span className="text-white/55">{statLine(star)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {latestState.complete && (
                <div className="rounded-xl border border-lime-300/40 bg-lime-400/10 px-3 py-2 text-center font-display text-xl uppercase text-lime-200">
                  {teams[latestSeries.winner].name} win the series {latestSeries.winner === latestSeries.high ? latestSeries.highWins : latestSeries.lowWins}–
                  {latestSeries.winner === latestSeries.high ? latestSeries.lowWins : latestSeries.highWins}
                </div>
              )}
            </motion.div>
          ) : (
            <p className="py-6 text-center text-muted-foreground">The best {seeds.length} teams are seeded. The first series is about to tip off…</p>
          )}
        </Panel>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0b1d]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg" variant="outline" className="h-11 gap-2 border-white/20 bg-transparent" disabled={done} onClick={() => setRunning((r) => !r)}>
              {active ? <Pause className="size-5" /> : <Play className="size-5" />}
              {active ? 'Pause' : 'Play'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 gap-2 border-white/20 bg-transparent"
              disabled={done}
              onClick={() => {
                setRunning(false)
                setPointer((p) => Math.min(steps.length, p + 1))
              }}
            >
              <StepForward className="size-5" /> Next game
            </Button>
            <Segmented
              size="sm"
              value={speed}
              onChange={(v) => setSpeed(v)}
              options={[
                { value: 1, label: '1x' },
                { value: 4, label: '4x' },
                { value: 16, label: '16x' },
              ]}
            />
          </div>
          {done ? (
            <Button size="lg" className="h-12 gap-2 px-8 font-display text-xl uppercase shadow-[0_0_30px_-6px_var(--primary)]" onClick={onDone}>
              Crown {teams[champion].name.split(' ').slice(-1)[0]} <ArrowRight className="size-5" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="lg" variant="outline" className="h-11 gap-2 border-white/20 bg-transparent" onClick={skipSeries}>
                <SkipForward className="size-5" /> Skip series
              </Button>
              <Button size="lg" className="h-11 gap-2 font-display text-lg uppercase" onClick={() => setPointer(steps.length)}>
                <SkipForward className="size-5" /> To the champion
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
