import { FastForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TeamAvatar } from '@/components/bits'
import { currentPick, type DraftState } from '@/engine/draft'
import { FORMATS } from '@/engine/formats'
import { cn } from '@/lib/utils'
import { ClockRing, Dots } from './helpers'

export function OnTheClock({
  draft,
  clockLeft,
  onSkipAhead,
  skipLabel,
}: {
  draft: DraftState
  clockLeft: number
  onSkipAhead?: () => void
  skipLabel?: string
}) {
  const cur = currentPick(draft)
  if (!cur) return null
  const team = draft.teams[cur.team]
  const T = draft.teams.length
  const clockOn = draft.settings.shotClock > 0 && team.human && draft.phase === 'pick'
  const hasMultipleHumans = draft.teams.filter((t) => t.human).length > 1
  return (
    <div
      className="relative overflow-hidden border-b border-white/10"
      style={{ background: `linear-gradient(100deg, ${team.color}40, rgb(13 11 29 / 0.9) 55%)` }}
    >
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-5">
        <div className={cn('rounded-full', team.human && 'anim-pulse-ring')} style={{ ['--pulse' as string]: team.color }}>
          <TeamAvatar icon={team.icon} color={team.color} size={52} ring />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-cond text-[13px] font-bold uppercase tracking-[0.25em]" style={{ color: team.color }}>
            <span className="inline-block size-2 animate-pulse rounded-full bg-current" />
            On the clock
            <span className="text-white/45">
              · Round {cur.round + 1}/{draft.settings.rounds} · Pick {cur.pickInRound + 1}/{T} · #{cur.overall + 1} overall
            </span>
          </div>
          <div className="truncate font-display text-[28px] uppercase leading-[1.05] text-white sm:text-4xl">{team.name}</div>
          <div className="flex items-center gap-2 truncate font-cond text-[14px] font-semibold uppercase tracking-wider text-white/70">
            {team.human ? (
              <>
                <span className="rounded bg-white/15 px-1.5 py-px text-[11.5px] tracking-widest text-white">{hasMultipleHumans ? 'Pass the device' : 'Your pick'}</span>
                {team.owner}
              </>
            ) : (
              <>
                <span className="rounded bg-white/10 px-1.5 py-px text-[11.5px] tracking-widest text-white/80">CPU</span>
                {team.owner} is deciding <Dots />
              </>
            )}
          </div>
        </div>
        {!team.human && onSkipAhead && (
          <Button variant="outline" size="sm" onClick={onSkipAhead} className="hidden gap-1.5 border-white/20 bg-black/20 sm:inline-flex">
            <FastForward className="size-4" />
            {skipLabel ?? 'Skip ahead'}
          </Button>
        )}
        {clockOn && <ClockRing left={clockLeft} total={draft.settings.shotClock} color={team.color} size={58} />}
        <div className="hidden text-right lg:block">
          <div className="font-cond text-[12px] font-bold uppercase tracking-[0.2em] text-white/45">{FORMATS[draft.settings.format].name}</div>
        </div>
      </div>
    </div>
  )
}
