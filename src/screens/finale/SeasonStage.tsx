import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Pause, Play, SkipForward } from 'lucide-react'
import { OvrBadge, TeamAvatar } from '@/components/bits'
import { Panel, Segmented } from '@/components/controls'
import { Button } from '@/components/ui/button'
import { computeAwards, computeStandings, type LTeam, type RegularSeason } from '@/engine/league'
import { gameScoreOf, statLine, topPerformer } from '@/engine/stats'
import { getPlayer } from '@/data/players'
import { sfx } from '@/audio/sfx'
import { cn } from '@/lib/utils'

export function SeasonStage({
  teams,
  season,
  playoffSize,
  onDone,
}: {
  teams: LTeam[]
  season: RegularSeason
  playoffSize: number
  onDone: () => void
}) {
  const weeks = season.weeks
  const [week, setWeek] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState<1 | 4 | 16>(1)
  const done = week >= weeks.length
  const active = running && !done

  useEffect(() => {
    const t = setTimeout(() => setRunning(true), 900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!active) return
    const delay = speed === 1 ? 800 : speed === 4 ? 240 : 40
    const t = setTimeout(() => {
      setWeek((w) => w + 1)
      if (speed === 1) sfx.tick()
    }, delay)
    return () => clearTimeout(t)
  }, [active, week, speed])

  useEffect(() => {
    if (done) sfx.whistle()
  }, [done])

  const played = useMemo(() => weeks.slice(0, week).flat(), [weeks, week])
  const standings = useMemo(() => computeStandings(teams.length, played), [teams.length, played])
  const latest = week > 0 ? weeks[week - 1] : []
  const awards = useMemo(() => (done ? computeAwards(season.totals, season.standings) : null), [done, season])

  const leaders = useMemo(() => {
    if (!done) return []
    const totals = season.totals.filter((t) => t.gp >= 3)
    const top = (f: (t: (typeof totals)[number]) => number) => [...totals].sort((a, b) => f(b) - f(a))[0]
    const entries = [
      { label: 'Points', t: top((t) => t.pts / t.gp), v: (t: (typeof totals)[number]) => (t.pts / t.gp).toFixed(1) },
      { label: 'Rebounds', t: top((t) => t.reb / t.gp), v: (t: (typeof totals)[number]) => (t.reb / t.gp).toFixed(1) },
      { label: 'Assists', t: top((t) => t.ast / t.gp), v: (t: (typeof totals)[number]) => (t.ast / t.gp).toFixed(1) },
      { label: 'Steals', t: top((t) => t.stl / t.gp), v: (t: (typeof totals)[number]) => (t.stl / t.gp).toFixed(1) },
      { label: 'Blocks', t: top((t) => t.blk / t.gp), v: (t: (typeof totals)[number]) => (t.blk / t.gp).toFixed(1) },
    ]
    return entries.filter((e) => e.t)
  }, [done, season])

  return (
    <div className="mx-auto grid max-w-[1400px] gap-4 px-3 pt-4 pb-28 sm:px-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel
        title="Standings"
        right={
          <span className="font-cond text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
            Week {Math.min(week, weeks.length)} of {weeks.length}
          </span>
        }
      >
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all" style={{ width: `${(week / Math.max(1, weeks.length)) * 100}%` }} />
        </div>
        <div className="grid grid-cols-[28px_minmax(0,1fr)_40px_40px_52px_52px_70px] items-center gap-2 px-2 pb-1 font-cond text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
          <span />
          <span>Team</span>
          <span className="text-right">W</span>
          <span className="text-right">L</span>
          <span className="hidden text-right sm:block">Diff</span>
          <span className="hidden text-right sm:block">Strk</span>
          <span className="hidden text-right sm:block">Last 5</span>
        </div>
        <ul className="space-y-1">
          {standings.map((s, i) => {
            const t = teams[s.idx]
            const cutoff = i === playoffSize - 1
            const inPlayoffs = i < playoffSize
            const diff = s.pf - s.pa
            return (
              <motion.li
                layout
                key={t.idx}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                className={cn(
                  'grid grid-cols-[28px_minmax(0,1fr)_40px_40px_52px_52px_70px] items-center gap-2 rounded-lg border px-2 py-1.5',
                  inPlayoffs ? 'border-white/15 bg-white/[0.07]' : 'border-white/5 bg-white/[0.02] opacity-75',
                  cutoff && done && 'mb-2 border-b-2 border-b-primary/60',
                )}
              >
                <span className="text-center font-display text-lg text-white/50">{i + 1}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <TeamAvatar icon={t.icon} color={t.color} size={28} />
                  <span className="truncate font-cond text-[15.5px] font-bold uppercase text-white">{t.name}</span>
                </span>
                <span className="text-right font-display text-xl text-white">{s.w}</span>
                <span className="text-right font-display text-xl text-white/60">{s.l}</span>
                <span className={cn('hidden text-right font-cond text-[14px] font-bold sm:block', diff > 0 ? 'text-lime-300' : diff < 0 ? 'text-red-300' : 'text-white/50')}>
                  {diff > 0 ? '+' : ''}
                  {diff}
                </span>
                <span className={cn('hidden text-right font-cond text-[14px] font-bold sm:block', s.streak > 0 ? 'text-lime-300' : 'text-red-300')}>
                  {s.streak === 0 ? '–' : `${s.streak > 0 ? 'W' : 'L'}${Math.abs(s.streak)}`}
                </span>
                <span className="hidden justify-end gap-0.5 sm:flex">
                  {s.last5.map((w, k) => (
                    <span key={k} className={cn('size-2.5 rounded-sm', w ? 'bg-lime-400' : 'bg-red-500')} />
                  ))}
                </span>
              </motion.li>
            )
          })}
        </ul>
        {done && (
          <p className="mt-2 font-cond text-[13px] font-semibold uppercase tracking-wider text-primary">
            Top {playoffSize} teams advance to the playoffs
          </p>
        )}
      </Panel>

      <div className="space-y-4">
        <Panel title={done ? 'Season awards' : week === 0 ? 'Tip-off' : `Week ${week} scores`}>
          {done && awards ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'League MVP', t: awards.mvp, color: '#fbbf24' },
                  { label: 'Defensive Player', t: awards.defense, color: '#22d3ee' },
                ].map(
                  (a) =>
                    a.t && (
                      <div key={a.label} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: `${a.color}55`, background: `${a.color}14` }}>
                        <OvrBadge player={getPlayer(a.t.id)} />
                        <div className="min-w-0 flex-1">
                          <div className="font-cond text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: a.color }}>
                            {a.label}
                          </div>
                          <div className="truncate font-display text-xl uppercase leading-tight text-white">{a.t.name}</div>
                          <div className="font-cond text-[12.5px] font-semibold uppercase text-white/55">
                            {teams[a.t.team].name} · {(a.t.pts / a.t.gp).toFixed(1)} / {(a.t.reb / a.t.gp).toFixed(1)} / {(a.t.ast / a.t.gp).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ),
                )}
              </div>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {leaders.map((l) => (
                  <li key={l.label} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-2.5 py-1.5">
                    <span className="w-16 font-cond text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{l.label}</span>
                    <span className="min-w-0 flex-1 truncate font-cond text-[14px] font-bold uppercase text-white">{l.t.name.split(' ').slice(-1)[0]}</span>
                    <span className="font-display text-lg text-white">{l.v(l.t)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {latest.length === 0 && <li className="p-2 text-sm text-muted-foreground">The first games are about to tip off…</li>}
              {latest.map((g, i) => {
                const home = teams[g.home]
                const away = teams[g.away]
                const homeWon = g.hs > g.as
                const star = topPerformer(homeWon ? g.homeBox : g.awayBox)
                return (
                  <motion.li key={`${week}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg bg-white/[0.05] px-2.5 py-1.5">
                    <div className="flex items-center gap-2 font-cond text-[15px] font-bold uppercase">
                      <span className={cn('min-w-0 flex-1 truncate text-right', !homeWon && 'text-white/50', homeWon && 'text-white')}>{away.name}</span>
                      <span className="font-display text-lg text-white">{g.as}</span>
                      <span className="text-white/30">@</span>
                      <span className="font-display text-lg text-white">{g.hs}</span>
                      <span className={cn('min-w-0 flex-1 truncate', homeWon ? 'text-white' : 'text-white/50')}>{home.name}</span>
                    </div>
                    {star && gameScoreOf(star) > 30 && (
                      <div className="text-center font-cond text-[11.5px] font-semibold uppercase tracking-wide text-white/45">
                        {star.name}: {statLine(star)}
                      </div>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0b1d]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button size="lg" variant="outline" className="h-11 gap-2 border-white/20 bg-transparent" disabled={done} onClick={() => setRunning((r) => !r)}>
              {active ? <Pause className="size-5" /> : <Play className="size-5" />}
              {active ? 'Pause' : 'Play'}
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
              To the playoffs <ArrowRight className="size-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-11 gap-2 font-display text-lg uppercase"
              onClick={() => {
                setWeek(weeks.length)
              }}
            >
              <SkipForward className="size-5" /> Sim the season
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
