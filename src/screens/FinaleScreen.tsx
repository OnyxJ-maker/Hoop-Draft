import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { AppBar } from '@/components/AppBar'
import type { DraftState } from '@/engine/draft'
import { buildLTeams } from '@/engine/finale'
import { simPlayoffs, simRegularSeason } from '@/engine/league'
import { cn } from '@/lib/utils'
import { useGame } from '@/store/game'
import { ChampionStage } from './finale/ChampionStage'
import { PlayoffsStage } from './finale/PlayoffsStage'
import { SeasonStage } from './finale/SeasonStage'
import { Season82Screen } from './Season82Screen'

type Stage = 'season' | 'playoffs' | 'champion'

export function FinaleScreen() {
  const draft = useGame((s) => s.draft)
  if (!draft) return null
  if (draft.settings.finale === 'season82') return <Season82Screen />
  return <LeagueFlow draft={draft} />
}

function LeagueFlow({ draft }: { draft: DraftState }) {
  const seed = useGame((s) => s.finaleSeed)
  const teams = useMemo(() => buildLTeams(draft), [draft])
  const hasSeason = draft.settings.finale === 'league'
  const season = useMemo(() => (hasSeason ? simRegularSeason(teams, draft.settings.seasonRepeats, seed) : null), [hasSeason, teams, draft.settings.seasonRepeats, seed])
  const seedOrder = useMemo(
    () => (season ? season.standings.map((s) => s.idx) : [...teams].sort((a, b) => b.margin - a.margin).map((t) => t.idx)),
    [season, teams],
  )
  const playoffs = useMemo(() => simPlayoffs(teams, seedOrder, draft.settings.bestOf, seed), [teams, seedOrder, draft.settings.bestOf, seed])
  const [stage, setStage] = useState<Stage>(hasSeason ? 'season' : 'playoffs')

  const stages: Array<{ id: Stage; label: string }> = [
    ...(hasSeason ? [{ id: 'season' as Stage, label: 'Regular season' }] : []),
    { id: 'playoffs', label: hasSeason ? 'Playoffs' : 'Showdown' },
    { id: 'champion', label: 'Champion' },
  ]
  const idx = stages.findIndex((s) => s.id === stage)

  return (
    <div className="min-h-screen">
      <AppBar title={stage === 'champion' ? 'Champions' : hasSeason ? 'League season' : 'The showdown'}>
        <ol className="mr-2 hidden items-center gap-1 md:flex">
          {stages.map((s, i) => (
            <li
              key={s.id}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 font-cond text-[12.5px] font-bold uppercase tracking-wider',
                i === idx ? 'bg-primary text-primary-foreground' : i < idx ? 'bg-white/10 text-white/80' : 'text-white/40',
              )}
            >
              {i < idx && <Check className="size-3.5" />}
              {s.label}
            </li>
          ))}
        </ol>
      </AppBar>
      {stage === 'season' && season && <SeasonStage teams={teams} season={season} playoffSize={playoffs.seeds.length} onDone={() => setStage('playoffs')} />}
      {stage === 'playoffs' && <PlayoffsStage teams={teams} playoffs={playoffs} onDone={() => setStage('champion')} />}
      {stage === 'champion' && <ChampionStage draft={draft} teams={teams} playoffs={playoffs} season={season} seed={seed} />}
    </div>
  )
}
