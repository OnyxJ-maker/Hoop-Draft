import { useMemo } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Brain, Crown, Gem, Sparkles, TrendingDown } from 'lucide-react'
import { AppBar } from '@/components/AppBar'
import { DraftBoardMatrix } from '@/components/DraftBoardMatrix'
import { OvrBadge, TeamAvatar } from '@/components/bits'
import { Panel } from '@/components/controls'
import { TeamRating } from '@/components/TeamPanel'
import { Button } from '@/components/ui/button'
import { getPlayer } from '@/data/players'
import { PROMPT_BY_ID } from '@/data/prompts'
import { type DraftState } from '@/engine/draft'
import { pickValue, teamReport, type TeamReport } from '@/engine/finale'
import { FORMATS } from '@/engine/formats'
import { sfx } from '@/audio/sfx'
import { useGame } from '@/store/game'
import { cn } from '@/lib/utils'

const YEAR = new Date().getFullYear()

function Superlative({
  icon,
  label,
  title,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  title: string
  sub: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: `${color}55`, background: `linear-gradient(120deg, ${color}22, transparent)` }}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: color, color: '#120d1f' }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-cond text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
          {label}
        </div>
        <div className="truncate font-display text-xl uppercase leading-tight text-white">{title}</div>
        <div className="truncate font-cond text-[13px] font-semibold uppercase tracking-wide text-white/60">{sub}</div>
      </div>
    </div>
  )
}

function superlatives(draft: DraftState, reports: TeamReport[]) {
  const out: Array<{ icon: React.ReactNode; label: string; title: string; sub: string; color: string }> = []
  const best = [...reports].sort((a, b) => b.power - a.power)[0]
  const bt = draft.teams[best.team]
  out.push({ icon: <Crown className="size-5" />, label: 'Best draft', title: bt.name, sub: `${best.grade.letter} · ${Math.round(best.power)} rating · ${best.identity}`, color: '#fbbf24' })

  const format = draft.settings.format
  if (format === 'ball-knowledge') {
    const smart = [...reports].sort((a, b) => b.avgFit - a.avgFit)[0]
    out.push({ icon: <Brain className="size-5" />, label: 'Ball knowledge genius', title: draft.teams[smart.team].owner, sub: `${Math.round(smart.avgFit)} avg fit · ${smart.perfectReads} perfect reads`, color: '#f43f9d' })
    const whiff = [...draft.picks].sort((a, b) => (a.fit ?? 0) - (b.fit ?? 0))[0]
    if (whiff) {
      const pr = PROMPT_BY_ID[draft.rounds[whiff.round].promptId as string]
      out.push({
        icon: <TrendingDown className="size-5" />,
        label: 'Biggest whiff',
        title: `${draft.teams[whiff.team].owner}: ${getPlayer(whiff.playerId).name}`,
        sub: `${pr.title} · fit ${whiff.fit}`,
        color: '#f87171',
      })
    }
  } else if (format === 'pack' || format === 'time-machine') {
    const pull = [...draft.picks].sort((a, b) => getPlayer(b.playerId).ovr - getPlayer(a.playerId).ovr)[0]
    out.push({ icon: <Sparkles className="size-5" />, label: 'Best pull', title: getPlayer(pull.playerId).name, sub: `${draft.teams[pull.team].owner} · ${getPlayer(pull.playerId).ovr} OVR`, color: '#22d3ee' })
  } else {
    const values = draft.picks.map((p) => pickValue(draft, p))
    const steal = [...values].sort((a, b) => b.delta - a.delta)[0]
    const reach = [...values].sort((a, b) => a.delta - b.delta)[0]
    if (steal) out.push({ icon: <Gem className="size-5" />, label: 'Steal of the draft', title: getPlayer(steal.pick.playerId).name, sub: `${draft.teams[steal.pick.team].owner} · pick #${steal.pick.overall + 1}`, color: '#a3e635' })
    if (reach && reach.delta < -10)
      out.push({ icon: <TrendingDown className="size-5" />, label: 'Biggest reach', title: getPlayer(reach.pick.playerId).name, sub: `${draft.teams[reach.pick.team].owner} · pick #${reach.pick.overall + 1}`, color: '#fb923c' })
  }
  return out
}

export function RecapScreen() {
  const draft = useGame((s) => s.draft)
  const toFinale = useGame((s) => s.toFinale)
  const reports = useMemo(() => (draft ? draft.teams.map((_, i) => teamReport(draft, i)) : []), [draft])
  if (!draft) return null
  const ranked = [...reports].sort((a, b) => b.power - a.power)
  const finale = draft.settings.finale
  const cta = finale === 'season82' ? 'Sim the 82-game season' : finale === 'league' ? 'Play the season' : 'Start the showdown'
  const f = FORMATS[draft.settings.format]
  const sups = superlatives(draft, reports)

  return (
    <div className="min-h-screen pb-28">
      <AppBar title="Draft report cards" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-6 sm:px-6">
        <div>
          <div className="font-cond text-[13px] font-bold uppercase tracking-[0.3em]" style={{ color: f.accent }}>
            {f.name} · {draft.teams.length} teams · {draft.picks.length} picks
          </div>
          <h1 className="font-display text-5xl uppercase leading-none text-white sm:text-6xl">The class of {YEAR}</h1>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sups.map((s) => (
            <Superlative key={s.label} {...s} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranked.map((r, rank) => {
            const t = draft.teams[r.team]
            const roster = [...r.roster].sort((a, b) => b.ovr - a.ovr)
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.05 }}>
                <Panel className={cn('h-full', t.human && 'border-primary/50')}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="w-9 text-center font-display text-3xl leading-none text-white/40">#{rank + 1}</span>
                    <TeamAvatar icon={t.icon} color={t.color} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-2xl uppercase leading-none text-white">{t.name}</div>
                      <div className="truncate font-cond text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.human ? t.owner : `CPU · ${t.owner}`} · <span className="text-white/80">{r.identity}</span>
                      </div>
                    </div>
                  </div>
                  <TeamRating roster={r.roster} bonus={r.bonus} bonusLabel="Ball Knowledge" needed={draft.settings.rounds} />
                  <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {roster.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-2 py-1">
                        <OvrBadge player={p} className="h-6 min-w-8 text-[15px]" />
                        <span className="min-w-0 flex-1 truncate font-cond text-[14px] font-bold uppercase text-white">{p.name}</span>
                        <span className="font-cond text-[11px] font-semibold uppercase text-white/45">{p.pos[0]}</span>
                      </li>
                    ))}
                  </ul>
                  {draft.settings.format === 'ball-knowledge' && (
                    <div className="mt-3 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 font-cond text-[13.5px] font-bold uppercase tracking-wide text-fuchsia-100">
                      Ball knowledge {Math.round(r.avgFit)} · {r.perfectReads} perfect read{r.perfectReads === 1 ? '' : 's'}
                    </div>
                  )}
                </Panel>
              </motion.div>
            )
          })}
        </div>

        <Panel title="The draft board">
          <DraftBoardMatrix draft={draft} />
        </Panel>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0b1d]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="truncate font-display text-xl uppercase leading-none text-white sm:text-2xl">Rosters are locked</div>
            <div className="truncate font-cond text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              {finale === 'season82' ? 'Time to chase 82-0' : finale === 'league' ? 'A full season and playoffs decide it' : 'A seeded bracket decides it'}
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => {
              sfx.whistle()
              toFinale()
            }}
            className="h-12 gap-2 px-8 font-display text-xl uppercase tracking-wide shadow-[0_0_30px_-6px_var(--primary)]"
          >
            {cta} <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
