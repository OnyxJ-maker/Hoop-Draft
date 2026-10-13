import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Copy, Home, Pause, Play, RotateCcw, SkipForward, Trophy } from 'lucide-react'
import { AppBar } from '@/components/AppBar'
import { OvrBadge, TeamAvatar } from '@/components/bits'
import { Panel } from '@/components/controls'
import { PlayerCard } from '@/components/PlayerCard'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/controls'
import { rosterOf } from '@/engine/draft'
import { teamReport } from '@/engine/finale'
import { formatOdds, makeLeague82, schedule82, simSeason82, type Season82Result } from '@/engine/season82'
import { sfx } from '@/audio/sfx'
import { cannons, burst, GOLD, RAINBOW } from '@/lib/confetti'
import { cn } from '@/lib/utils'
import { useGame } from '@/store/game'
import { useSettings } from '@/store/settings'

interface Lane {
  team: number
  result: Season82Result
  cum: number[]
  power: number
}

export function Season82Screen() {
  const draft = useGame((s) => s.draft)
  const seed = useGame((s) => s.finaleSeed)
  const endGame = useGame((s) => s.endGame)
  const startDraft = useGame((s) => s.startDraft)
  const goto = useGame((s) => s.goto)
  const addHof = useSettings((s) => s.addHof)

  const teamNames = useMemo(() => (draft ? draft.teams.map((t) => t.name) : []), [draft])
  const league = useMemo(() => makeLeague82(seed, teamNames), [seed, teamNames])
  const sched = useMemo(() => schedule82(league, seed), [league, seed])
  const lanes: Lane[] = useMemo(() => {
    if (!draft) return []
    return draft.teams.map((_, i) => {
      const roster = rosterOf(draft, i)
      const power = teamReport(draft, i).power
      const result = simSeason82(roster, power, league, sched, `${seed}-${i}`)
      const cum: number[] = [0]
      result.games.forEach((g, gi) => cum.push(cum[gi] + (g.win ? 1 : 0)))
      return { team: i, result, cum, power }
    })
  }, [draft, league, sched, seed])

  const firstHuman = Math.max(0, draft?.teams.findIndex((t) => t.human) ?? 0)
  const [focus, setFocus] = useState(firstHuman)
  const [g, setG] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState<1 | 4 | 16>(1)
  const [flash, setFlash] = useState<'loss' | 'win' | null>(null)
  const [dead, setDead] = useState<Record<number, number>>({})
  const savedRef = useRef(false)
  const total = 82
  const done = g >= total

  const humans = useMemo(() => (draft ? draft.teams.map((t, i) => (t.human ? i : -1)).filter((i) => i >= 0) : []), [draft])
  const anyHumanPerfect = humans.some((h) => lanes[h] && lanes[h].cum[g] === g)

  useEffect(() => {
    const t = setTimeout(() => setRunning(true), 1400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!running || done || lanes.length === 0) return
    let delay = speed === 1 ? 120 : speed === 4 ? 34 : 6
    if (speed === 1 && anyHumanPerfect && g >= 36) delay = g >= 78 ? 1100 : g >= 70 ? 620 : g >= 58 ? 360 : 220
    const t = setTimeout(() => {
      const next = g + 1
      setG(next)
      for (const h of humans) {
        const lane = lanes[h]
        const wasPerfect = lane.cum[g] === g
        const lost = !lane.result.games[g].win
        if (wasPerfect && lost && g > 0) {
          setDead((d) => ({ ...d, [h]: next }))
          if (h === focus || humans.length === 1) {
            sfx.buzzer()
            setFlash('loss')
            setTimeout(() => setFlash(null), 900)
          }
        }
      }
      if (delay >= 300) sfx.swish()
      else if (speed === 1 && next % 6 === 0) sfx.tick()
    }, delay)
    return () => clearTimeout(t)
  }, [running, done, g, speed, lanes, humans, anyHumanPerfect, focus])

  useEffect(() => {
    if (!done || !draft || savedRef.current || lanes.length === 0) return
    savedRef.current = true
    setRunning(false)
    const perfect = lanes.filter((l) => l.result.wins === total && draft.teams[l.team].human)
    if (perfect.length > 0) {
      sfx.fanfare()
      cannons(RAINBOW)
    } else if (lanes.some((l) => draft.teams[l.team].human && l.result.wins >= 70)) {
      sfx.win()
      burst(GOLD, 80)
    } else sfx.loss()
    for (const l of lanes) {
      const t = draft.teams[l.team]
      if (!t.human) continue
      addHof({
        id: `${seed}-${t.id}-82`,
        date: Date.now(),
        mode: 'season82',
        kind: 'season82',
        owner: t.owner,
        teamName: t.name,
        color: t.color,
        icon: t.icon,
        wins: l.result.wins,
        losses: l.result.losses,
        perfect: l.result.wins === total,
        power: Math.round(l.power),
        roster: draft.rosters[l.team],
        format: draft.settings.format,
      })
    }
  }, [done, draft, lanes, addHof, seed])

  if (!draft || lanes.length === 0) return null
  const focusLane = lanes[Math.min(focus, lanes.length - 1)]
  const ft = draft.teams[focusLane.team]
  const wins = focusLane.cum[g]
  const losses = g - wins
  const fGames = focusLane.result.games
  const lastGames = fGames.slice(Math.max(0, g - 5), g).reverse()
  const nextGame = g < total ? fGames[g] : null
  const nextOpp = nextGame ? league[nextGame.opp] : null
  const focusRoster = rosterOf(draft, focusLane.team).sort((a, b) => b.ovr - a.ovr)
  const perfectSoFar = losses === 0 && g > 0
  const standings = [...lanes].sort((a, b) => b.cum[g] - a.cum[g] || b.power - a.power)

  const stopAndFinish = () => {
    setG(total)
    setRunning(false)
  }

  return (
    <div className={cn('min-h-screen pb-28', flash === 'loss' && 'anim-shake')}>
      <AppBar title="The 82-game chase" />
      <AnimatePresence>
        {flash === 'loss' && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none fixed inset-0 z-40 bg-red-600/40"
          />
        )}
      </AnimatePresence>

      <main className="mx-auto grid max-w-[1400px] gap-4 px-3 pt-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Panel className={cn('overflow-hidden', perfectSoFar && g >= 40 && 'border-lime-300/50 shadow-[0_0_60px_-20px_#a3e635]')}>
            <div className="flex flex-wrap items-center gap-4">
              <TeamAvatar icon={ft.icon} color={ft.color} size={64} ring />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-3xl uppercase leading-none text-white sm:text-4xl">{ft.name}</div>
                <div className="font-cond text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {ft.owner} · Team rating {Math.round(focusLane.power)} · Perfect odds {formatOdds(focusLane.result.perfectOdds)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-cond text-[12px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  Game {Math.min(g + 1, total)} of {total}
                </div>
                <div
                  className={cn(
                    'font-display text-[88px] leading-[0.9] sm:text-[120px]',
                    perfectSoFar ? 'text-lime-300' : losses > 0 ? 'text-white' : 'text-white/60',
                  )}
                  aria-live="polite"
                >
                  {wins}–{losses}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[repeat(41,minmax(0,1fr))] gap-[3px]" aria-label="Season results">
              {Array.from({ length: total }, (_, i) => {
                const played = i < g
                const win = fGames[i].win
                return (
                  <span
                    key={i}
                    className={cn(
                      'aspect-square rounded-[3px] transition-colors duration-200',
                      !played && 'bg-white/10',
                      played && win && 'bg-lime-400 shadow-[0_0_8px_-1px_#a3e635]',
                      played && !win && 'bg-red-500 shadow-[0_0_8px_-1px_#ef4444]',
                      i === g && !done && 'animate-pulse bg-white/60',
                    )}
                  />
                )
              })}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.4fr]">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="font-cond text-[12px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{done ? 'Season complete' : 'Tonight'}</div>
                {nextOpp && nextGame ? (
                  <>
                    <div className="mt-1 flex items-center gap-2">
                      <TeamAvatar icon={nextOpp.icon} color={nextOpp.color} size={36} />
                      <div className="min-w-0">
                        <div className="truncate font-display text-xl uppercase leading-none text-white">
                          {nextGame.home ? 'vs' : '@'} {nextOpp.name}
                        </div>
                        <div className="font-cond text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Rating {Math.round(nextOpp.power)} · {nextGame.home ? 'Home' : 'Road'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-cond text-[13px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">Win probability</span>
                      <span className={nextGame.winProb > 0.97 ? 'text-lime-300' : nextGame.winProb > 0.9 ? 'text-amber-300' : 'text-orange-400'}>
                        {(nextGame.winProb * 100).toFixed(1)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mt-1 font-display text-3xl uppercase text-white">{focusLane.result.wins}–{focusLane.result.losses}</div>
                )}
              </div>
              <ul className="space-y-1">
                {lastGames.length === 0 && <li className="p-2 text-sm text-muted-foreground">Tip-off is about to happen…</li>}
                {lastGames.map((gm) => {
                  const opp = league[gm.opp]
                  return (
                    <motion.li
                      key={gm.n}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-2 py-1.5"
                    >
                      <span className={cn('grid size-6 shrink-0 place-items-center rounded font-display text-sm', gm.win ? 'bg-lime-400 text-black' : 'bg-red-500 text-white')}>
                        {gm.win ? 'W' : 'L'}
                      </span>
                      <span className="w-[74px] shrink-0 font-display text-[16px] text-white">
                        {gm.us}-{gm.them}
                        {gm.ot && <span className="ml-1 font-cond text-[10px] text-amber-300">OT</span>}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-cond text-[13.5px] font-semibold uppercase text-white/75">
                        {gm.home ? 'vs' : '@'} {opp.name}
                        <span className="text-white/40"> · {gm.star.split(' ').slice(-1)[0]}: {gm.starLine}</span>
                      </span>
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          </Panel>

          <Panel title="Roster">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {focusRoster.slice(0, 10).map((p) => (
                <PlayerCard key={p.id} player={p} size="sm" tilt={false} />
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel title="Every team's chase">
            <ul className="space-y-1.5">
              {standings.map((l, rank) => {
                const t = draft.teams[l.team]
                const w = l.cum[g]
                const lo = g - w
                const diedAt = dead[l.team]
                return (
                  <motion.li layout key={t.id} transition={{ type: 'spring', stiffness: 400, damping: 34 }}>
                    <button
                      type="button"
                      onClick={() => setFocus(l.team)}
                      className={cn(
                        'w-full rounded-xl border px-2.5 py-2 text-left transition-colors',
                        focus === l.team ? 'border-white/50 bg-white/15' : 'border-white/10 bg-white/[0.04] hover:bg-white/10',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-display text-sm text-white/45">{rank + 1}</span>
                        <TeamAvatar icon={t.icon} color={t.color} size={28} />
                        <span className="min-w-0 flex-1 truncate font-cond text-[15px] font-bold uppercase text-white">{t.name}</span>
                        <span className={cn('font-display text-xl leading-none', lo === 0 && g > 0 ? 'text-lime-300' : 'text-white')}>
                          {w}–{lo}
                        </span>
                      </div>
                      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="bg-lime-400 transition-all" style={{ width: `${(w / total) * 100}%` }} />
                        <div className="bg-red-500 transition-all" style={{ width: `${(lo / total) * 100}%` }} />
                      </div>
                      {t.human && (
                        <div className="mt-1 font-cond text-[11.5px] font-bold uppercase tracking-wider text-white/50">
                          {lo === 0 && g > 0 ? 'Still perfect' : diedAt ? `Perfection ended in game ${diedAt}` : t.owner}
                        </div>
                      )}
                    </button>
                  </motion.li>
                )
              })}
            </ul>
          </Panel>
        </aside>
      </main>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-[#07050f]/92 p-4 backdrop-blur-md"
          >
            <FinalSummary
              lanes={lanes}
              draft={draft}
              focus={focusLane}
              onAgain={() => startDraft()}
              onMenu={() => endGame()}
              onHall={() => {
                goto('hof')
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0b1d]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button size="lg" variant="outline" className="h-11 gap-2 border-white/20 bg-transparent" onClick={() => setRunning((r) => !r)} disabled={done}>
              {running ? <Pause className="size-5" /> : <Play className="size-5" />}
              {running ? 'Pause' : 'Play'}
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
          <div className="font-cond text-[14px] font-bold uppercase tracking-wider text-muted-foreground">
            {anyHumanPerfect && g > 0 ? `Still undefeated through ${g}` : done ? 'Season complete' : 'The streak is alive only while it lasts'}
          </div>
          <Button size="lg" className="h-11 gap-2 font-display text-lg uppercase" onClick={stopAndFinish} disabled={done}>
            <SkipForward className="size-5" /> Sim to the end
          </Button>
        </div>
      </div>
    </div>
  )
}

function FinalSummary({
  lanes,
  draft,
  focus,
  onAgain,
  onMenu,
  onHall,
}: {
  lanes: Lane[]
  draft: NonNullable<ReturnType<typeof useGame.getState>['draft']>
  focus: Lane
  onAgain: () => void
  onMenu: () => void
  onHall: () => void
}) {
  const humans = lanes.filter((l) => draft.teams[l.team].human)
  const [who, setWho] = useState(focus.team)
  const mine = lanes[who]
  const ranked = [...lanes].sort((a, b) => b.result.wins - a.result.wins || b.power - a.power)
  const winner = ranked[0]
  const wt = draft.teams[winner.team]
  const mt = draft.teams[mine.team]
  const rank = ranked.findIndex((l) => l.team === who) + 1
  const perfect = mine.result.wins === 82
  const roster = rosterOf(draft, mine.team).sort((a, b) => b.ovr - a.ovr)
  const w = mine.result.wins
  const verdict =
    w === 82
      ? 'PERFECTION. 82-0.'
      : w >= 80
        ? 'SO close. One slip from immortality.'
        : w >= 73
          ? 'An all-time great season.'
          : w >= 65
            ? 'A dominant year.'
            : w >= 50
              ? 'A solid playoff team.'
              : w >= 35
                ? 'Mediocre. The draft needed more.'
                : 'A disaster. Better luck next draft.'
  const shareText = `${mt.owner} went ${mine.result.wins}-${mine.result.losses} in HOOP DRAFT 82-0 with ${mt.name} (rating ${Math.round(mine.power)}): ${roster.map((p) => p.name).join(', ')}`
  const [copied, setCopied] = useState(false)
  return (
    <div className="mx-auto max-w-4xl py-6">
      <motion.div
        key={who}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="text-center"
      >
        {humans.length > 1 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {humans.map((h) => {
              const t = draft.teams[h.team]
              return (
                <button
                  key={h.team}
                  type="button"
                  onClick={() => setWho(h.team)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1 font-cond text-[14px] font-bold uppercase tracking-wide transition-colors',
                    who === h.team ? 'border-white bg-white/20 text-white' : 'border-white/15 text-white/60 hover:bg-white/10',
                  )}
                >
                  <TeamAvatar icon={t.icon} color={t.color} size={22} />
                  {t.owner}
                </button>
              )
            })}
          </div>
        )}
        <div className="font-cond text-lg font-bold uppercase tracking-[0.4em] text-lime-300">
          {perfect ? 'Perfect season' : mt.human ? `${mt.owner}'s final record` : 'Final record'}
        </div>
        <div
          className={cn(
            'font-display text-[110px] leading-[0.9] sm:text-[170px]',
            perfect ? 'bg-gradient-to-r from-lime-300 via-amber-300 to-fuchsia-400 bg-clip-text text-transparent' : 'text-white',
          )}
        >
          {mine.result.wins}–{mine.result.losses}
        </div>
        <div className="mt-1 flex items-center justify-center gap-3">
          <TeamAvatar icon={mt.icon} color={mt.color} size={44} />
          <div className="text-left">
            <div className="font-display text-3xl uppercase leading-none text-white">{mt.name}</div>
            <div className="font-cond text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
              {mt.human ? mt.owner : `CPU · ${mt.owner}`} · finished #{rank} of {ranked.length}
            </div>
          </div>
        </div>
        <div className="mt-3 font-display text-3xl uppercase text-white sm:text-4xl">{verdict}</div>
        <div className="mt-1 font-cond text-[14px] font-semibold uppercase tracking-wider text-muted-foreground">
          {mine.result.firstLoss ? `First loss in game ${mine.result.firstLoss} · longest streak ${mine.result.longestStreak} · ` : ''}
          Perfect odds were {formatOdds(mine.result.perfectOdds)}
        </div>
        {winner.team !== mine.team && (
          <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 font-cond text-[14px] font-bold uppercase tracking-wide text-amber-200">
            <Trophy className="size-4" />
            {wt.name} won the race at {winner.result.wins}–{winner.result.losses}
          </div>
        )}
      </motion.div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel title="Final standings" icon={<Trophy className="size-5 text-amber-300" />}>
          <ol className="space-y-1.5">
            {ranked.map((l, i) => {
              const t = draft.teams[l.team]
              return (
                <li
                  key={t.id}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5',
                    l.team === who ? 'border-white/60 bg-white/15' : t.human ? 'border-primary/40 bg-primary/10' : 'border-white/10 bg-white/[0.04]',
                  )}
                >
                  <span className="w-6 text-center font-display text-lg text-white/50">{i + 1}</span>
                  <TeamAvatar icon={t.icon} color={t.color} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-cond text-[15px] font-bold uppercase leading-tight text-white">{t.name}</div>
                    <div className="truncate font-cond text-[11.5px] uppercase tracking-wide text-muted-foreground">
                      {t.owner} · rating {Math.round(l.power)} · odds {formatOdds(l.result.perfectOdds)}
                    </div>
                  </div>
                  <span className="font-display text-2xl text-white">
                    {l.result.wins}–{l.result.losses}
                  </span>
                </li>
              )
            })}
          </ol>
        </Panel>
        <Panel title={`${mt.name} roster`}>
          <ul className="space-y-1.5">
            {roster.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-2 py-1.5">
                <OvrBadge player={p} />
                <span className="min-w-0 flex-1 truncate font-cond text-[15px] font-bold uppercase text-white">{p.name}</span>
                <span className="font-cond text-[12px] font-semibold uppercase text-white/50">{p.archetype.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pb-6">
        <Button size="lg" className="h-12 gap-2 font-display text-lg uppercase" onClick={onAgain}>
          <RotateCcw className="size-5" /> Run it back
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12 gap-2 border-white/25 bg-transparent font-display text-lg uppercase"
          onClick={() => {
            void navigator.clipboard?.writeText(shareText)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          }}
        >
          <Copy className="size-5" /> {copied ? 'Copied!' : 'Copy result'}
        </Button>
        <Button size="lg" variant="ghost" className="h-12 gap-2 font-display text-lg uppercase" onClick={onHall}>
          <Trophy className="size-5" /> Hall of fame
        </Button>
        <Button size="lg" variant="ghost" className="h-12 gap-2 font-display text-lg uppercase" onClick={onMenu}>
          <Home className="size-5" /> Menu
        </Button>
      </div>
    </div>
  )
}
