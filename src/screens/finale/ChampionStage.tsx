import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Brain, Copy, Home, RotateCcw, Trophy } from 'lucide-react'
import { OvrBadge, TeamAvatar } from '@/components/bits'
import { Panel } from '@/components/controls'
import { PlayerCard } from '@/components/PlayerCard'
import { Button } from '@/components/ui/button'
import { getPlayer } from '@/data/players'
import type { DraftState } from '@/engine/draft'
import { teamAvgFit } from '@/engine/finale'
import type { LTeam, PlayoffResult, RegularSeason } from '@/engine/league'
import { sfx } from '@/audio/sfx'
import { cannons, rain, RAINBOW } from '@/lib/confetti'
import { cn } from '@/lib/utils'
import { roundName } from './PlayoffsStage'
import { useGame } from '@/store/game'
import { useSettings } from '@/store/settings'

export function ChampionStage({
  draft,
  teams,
  playoffs,
  season,
  seed,
}: {
  draft: DraftState
  teams: LTeam[]
  playoffs: PlayoffResult
  season: RegularSeason | null
  seed: number
}) {
  const startDraft = useGame((s) => s.startDraft)
  const endGame = useGame((s) => s.endGame)
  const goto = useGame((s) => s.goto)
  const addHof = useSettings((s) => s.addHof)
  const champ = teams[playoffs.champion]
  const ct = draft.teams[playoffs.champion]
  const finals = playoffs.rounds[playoffs.rounds.length - 1][0]
  const runnerUp = teams[finals.winner === finals.high ? finals.low : finals.high]
  const mvp = playoffs.finalsMvp ? getPlayer(playoffs.finalsMvp.id) : null
  const record = season?.standings.find((s) => s.idx === champ.idx)
  const saved = useRef(false)

  useEffect(() => {
    sfx.fanfare()
    cannons(RAINBOW)
    rain(RAINBOW, 3200)
  }, [])

  useEffect(() => {
    if (saved.current || !ct.human) return
    saved.current = true
    addHof({
      id: `${seed}-${ct.id}-champ`,
      date: Date.now(),
      mode: 'draft',
      kind: 'champion',
      owner: ct.owner,
      teamName: ct.name,
      color: ct.color,
      icon: ct.icon,
      wins: record?.w,
      losses: record?.l,
      power: Math.round(champ.power),
      roster: draft.rosters[champ.idx],
      format: draft.settings.format,
      note: `Beat ${runnerUp.name} ${finals.winner === finals.high ? finals.highWins : finals.lowWins}-${finals.winner === finals.high ? finals.lowWins : finals.highWins} in the finals`,
    })
  }, [addHof, champ, ct, draft, finals, record, runnerUp.name, seed])

  const roster = [...champ.roster].sort((a, b) => b.ovr - a.ovr)
  const bkRanking =
    draft.settings.format === 'ball-knowledge'
      ? draft.teams.map((t, i) => ({ t, fit: teamAvgFit(draft, i) })).sort((a, b) => b.fit - a.fit)
      : null
  const copy = () =>
    navigator.clipboard?.writeText(
      `${ct.name} (${ct.owner}) won the HOOP DRAFT ${draft.settings.format.replace('-', ' ')} title! Roster: ${roster.map((p) => p.name).join(', ')}`,
    )

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }} className="text-center">
        <div className="mx-auto mb-2 w-fit">
          <Trophy className="size-16 text-amber-300 drop-shadow-[0_0_24px_#fbbf24]" />
        </div>
        <div className="font-cond text-xl font-bold uppercase tracking-[0.5em] text-amber-300">Champions</div>
        <h1 className="font-display text-6xl uppercase leading-[0.95] text-white sm:text-8xl" style={{ textShadow: `0 0 60px ${ct.color}` }}>
          {ct.name}
        </h1>
        <div className="mt-3 flex items-center justify-center gap-3">
          <TeamAvatar icon={ct.icon} color={ct.color} size={48} ring />
          <div className="text-left font-cond text-lg font-semibold uppercase tracking-wider text-white/80">
            {ct.human ? ct.owner : `CPU · ${ct.owner}`}
            <div className="text-[13px] text-muted-foreground">
              {record ? `${record.w}–${record.l} regular season · ` : ''}
              beat {runnerUp.name} {finals.winner === finals.high ? finals.highWins : finals.lowWins}–{finals.winner === finals.high ? finals.lowWins : finals.highWins} in the finals
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="The championship roster">
          <div className="flex flex-wrap justify-center gap-3">
            {roster.slice(0, 8).map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                size="sm"
                tilt={false}
                tag={mvp && p.id === mvp.id ? <span className="rounded-full bg-amber-300 px-1.5 py-px font-display text-[10px] uppercase text-black">Finals MVP</span> : undefined}
              />
            ))}
          </div>
          {roster.length > 8 && <p className="mt-2 text-center text-sm text-muted-foreground">+ {roster.length - 8} more on the bench</p>}
        </Panel>

        <div className="space-y-4">
          {mvp && playoffs.finalsMvp && (
            <Panel title="Finals MVP">
              <div className="flex items-center gap-3">
                <OvrBadge player={mvp} />
                <div>
                  <div className="font-display text-2xl uppercase leading-none text-white">{mvp.name}</div>
                  <div className="font-cond text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{mvp.archetype.label}</div>
                </div>
              </div>
            </Panel>
          )}
          <Panel title="Playoff results">
            <ul className="space-y-2">
              {playoffs.rounds.map((series, r) => (
                <li key={r}>
                  <div className="mb-1 font-cond text-[12px] font-bold uppercase tracking-[0.2em] text-primary">
                    {roundName(r, playoffs.rounds.length)}
                  </div>
                  {series.map((s, i) => {
                    const w = teams[s.winner]
                    const l = teams[s.winner === s.high ? s.low : s.high]
                    const ww = s.winner === s.high ? s.highWins : s.lowWins
                    const lw = s.winner === s.high ? s.lowWins : s.highWins
                    return (
                      <div key={i} className="flex items-center gap-1.5 font-cond text-[13.5px] font-semibold uppercase">
                        <span className={cn('truncate', w.idx === playoffs.champion ? 'text-amber-200' : 'text-white')}>{w.name}</span>
                        <span className="font-display text-white/80">{ww}-{lw}</span>
                        <span className="truncate text-white/40">{l.name}</span>
                      </div>
                    )
                  })}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {bkRanking && (
        <Panel title="Ball knowledge leaderboard" icon={<Brain className="size-5 text-fuchsia-300" />} className="mt-5">
          <ol className="grid gap-1.5 sm:grid-cols-2">
            {bkRanking.map((r, i) => (
              <li key={r.t.id} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-2.5 py-1.5">
                <span className="w-6 text-center font-display text-lg text-white/50">{i + 1}</span>
                <TeamAvatar icon={r.t.icon} color={r.t.color} size={26} />
                <span className="min-w-0 flex-1 truncate font-cond text-[15px] font-bold uppercase text-white">{r.t.owner}</span>
                <span className="font-display text-xl text-fuchsia-200">{Math.round(r.fit)}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" className="h-12 gap-2 font-display text-lg uppercase" onClick={() => startDraft()}>
          <RotateCcw className="size-5" /> Run it back
        </Button>
        <Button size="lg" variant="outline" className="h-12 gap-2 border-white/25 bg-transparent font-display text-lg uppercase" onClick={copy}>
          <Copy className="size-5" /> Copy result
        </Button>
        <Button size="lg" variant="ghost" className="h-12 gap-2 font-display text-lg uppercase" onClick={() => goto('hof')}>
          <Trophy className="size-5" /> Hall of fame
        </Button>
        <Button size="lg" variant="ghost" className="h-12 gap-2 font-display text-lg uppercase" onClick={() => endGame()}>
          <Home className="size-5" /> Menu
        </Button>
      </div>
    </div>
  )
}
