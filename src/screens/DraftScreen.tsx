import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Flag } from 'lucide-react'
import { AppBar, FastToggle } from '@/components/AppBar'
import { TeamAvatar } from '@/components/bits'
import { Button } from '@/components/ui/button'
import { getPlayer } from '@/data/players'
import { canPick, currentPick, offerOf, rosterOf, type DraftState } from '@/engine/draft'
import { FORMATS } from '@/engine/formats'
import { sfx } from '@/audio/sfx'
import { cn } from '@/lib/utils'
import { useGame } from '@/store/game'
import { useSettings } from '@/store/settings'
import { useShotClock } from './draft/helpers'
import { CapBanner, DecadeBanner, SlotStrip } from './draft/Banners'
import { BoardDialog } from './draft/BoardDialog'
import { OnTheClock } from './draft/OnTheClock'
import { OpenBoard } from './draft/OpenBoard'
import { OrderRail } from './draft/OrderRail'
import { PackBoard } from './draft/PackBoard'
import { PerfectMeter } from './draft/PerfectMeter'
import { PickAnnouncement } from './draft/PickAnnouncement'
import { PoolBoard } from './draft/PoolBoard'
import { RoundIntro } from './draft/RoundIntro'
import { RoundReveal } from './draft/RoundReveal'
import { TurnSplash } from './draft/TurnSplash'
import { ScoutPanel, type RightTab } from './draft/ScoutPanel'

export function DraftScreen() {
  const draft = useGame((s) => s.draft)
  if (!draft) return null
  return <DraftRoom draft={draft} />
}

type MobileTab = 'board' | 'scout' | 'order'

function DraftRoom({ draft }: { draft: DraftState }) {
  const humanPick = useGame((s) => s.humanPick)
  const clockPick = useGame((s) => s.clockPick)
  const cpuStep = useGame((s) => s.cpuStep)
  const simAhead = useGame((s) => s.simAhead)
  const mulligan = useGame((s) => s.mulligan)
  const startRound = useGame((s) => s.startRound)
  const ackReveal = useGame((s) => s.ackReveal)
  const finishDraft = useGame((s) => s.finishDraft)
  const finaleSeed = useGame((s) => s.finaleSeed)
  const fast = useSettings((s) => s.fast)

  const cur = currentPick(draft)
  const format = draft.settings.format
  const fdef = FORMATS[format]
  const hasHuman = draft.teams.some((t) => t.human)
  const humanTurn = !!cur && draft.teams[cur.team].human && draft.phase === 'pick'
  const onClockTeam = cur?.team ?? draft.order[draft.order.length - 1]
  const onClock = draft.teams[onClockTeam]

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewTeam, setViewTeam] = useState(onClockTeam)
  const [tab, setTab] = useState<RightTab>('scout')
  const [mobileTab, setMobileTab] = useState<MobileTab>('board')

  const offer = useMemo(() => offerOf(draft), [draft])
  const offerItem = offer.items.find((i) => i.id === selectedId)

  const picksCount = draft.picks.length
  useEffect(() => {
    setSelectedId(null)
    setViewTeam(onClockTeam)
    setTab('scout')
  }, [picksCount, onClockTeam])

  useEffect(() => {
    if (selectedId && !offer.items.some((i) => i.id === selectedId)) setSelectedId(null)
  }, [offer, selectedId])

  const left = useShotClock(draft.settings.shotClock, humanTurn && !!cur, cur?.overall ?? -1, clockPick)

  useEffect(() => {
    if (draft.phase !== 'pick' || !cur || draft.teams[cur.team].human) return
    const delay = fast ? 90 : format === 'pack' ? 1300 : 1000
    const t = setTimeout(cpuStep, delay)
    return () => clearTimeout(t)
  }, [draft, cur, fast, format, cpuStep])

  useEffect(() => {
    if (draft.phase !== 'done') return
    sfx.fanfare()
    const t = setTimeout(finishDraft, 2200)
    return () => clearTimeout(t)
  }, [draft.phase, finishDraft])

  useEffect(() => {
    if (!hasHuman && draft.phase === 'reveal') {
      const t = setTimeout(ackReveal, 3200)
      return () => clearTimeout(t)
    }
  }, [draft.phase, hasHuman, ackReveal])

  const doDraft = (id: string) => {
    if (!humanTurn) return
    if (!canPick(draft, id).ok) return
    humanPick(id)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return
      if (draft.phase !== 'pick' || !selectedId) return
      e.preventDefault()
      doDraft(selectedId)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, draft, humanTurn])

  const select = (id: string) => {
    sfx.select()
    setSelectedId(id)
    setTab('scout')
  }

  const firstHuman = Math.max(0, draft.teams.findIndex((t) => t.human))
  const focusTeam = onClock.human ? onClockTeam : firstHuman
  const focusRoster = useMemo(() => rosterOf(draft, focusTeam), [draft, focusTeam])
  const selectedPlayer = selectedId ? getPlayer(selectedId) : null

  const lastPick = draft.picks[draft.picks.length - 1]
  const recent = draft.picks.slice(-6).reverse()

  const scout = (
    <ScoutPanel
      draft={draft}
      selectedId={selectedId}
      onClockTeam={onClockTeam}
      canAct={humanTurn}
      waitingFor={cur && !humanTurn ? `${onClock.owner} is picking…` : draft.phase !== 'pick' ? 'Round starting…' : undefined}
      offerItem={offerItem}
      onDraft={doDraft}
      viewTeam={viewTeam}
      setViewTeam={(t) => {
        setViewTeam(t)
        setTab('team')
      }}
      tab={tab}
      setTab={setTab}
    />
  )

  const board = (() => {
    if (offer.kind === 'pack') {
      return (
        <PackBoard
          items={offer.items}
          packKey={`${cur?.overall}-${draft.rerolls[cur?.overall ?? 0] ?? 0}`}
          selectedId={selectedId}
          onSelect={select}
          onConfirm={doDraft}
          canAct={humanTurn}
          mulligansLeft={draft.mulligans[onClockTeam]}
          onMulligan={mulligan}
          teamName={onClock.name}
        />
      )
    }
    if (offer.kind === 'pool') {
      return <PoolBoard draft={draft} selectedId={selectedId} onSelect={select} onConfirm={doDraft} canAct={humanTurn} />
    }
    return (
      <OpenBoard
        items={offer.items}
        selectedId={selectedId}
        onSelect={select}
        onConfirm={doDraft}
        showPrice={format === 'cap'}
        canAct={humanTurn}
        banner={
          format === 'time-machine' && !offer.fallbackAnyEra && cur ? (
            <DecadeBanner decade={draft.rounds[cur.round].decade as number} count={offer.items.length} />
          ) : format === 'cap' ? (
            <CapBanner draft={draft} team={onClockTeam} />
          ) : format === 'starting-five' ? (
            <SlotStrip draft={draft} team={onClockTeam} selectedId={selectedId} />
          ) : undefined
        }
      />
    )
  })()

  return (
    <div className="flex h-[100dvh] flex-col">
      <AppBar
        title={
          <span className="flex items-center gap-3">
            {fdef.name}
            <span className="hidden font-cond text-base font-semibold tracking-widest text-muted-foreground md:inline">
              {draft.picks.length}/{draft.order.length} picks
            </span>
          </span>
        }
        right={
          <>
            <BoardDialog draft={draft} />
            <FastToggle />
          </>
        }
      />
      <OnTheClock draft={draft} clockLeft={left} onSkipAhead={simAhead} skipLabel="Skip to a human pick" />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[238px_minmax(0,1fr)_370px]">
        <aside className={cn('min-h-0', mobileTab === 'order' ? 'block' : 'hidden', 'lg:block')}>
          <OrderRail draft={draft} viewTeam={viewTeam} onViewTeam={(t) => { setViewTeam(t); setTab('team'); setMobileTab('scout') }} />
        </aside>
        <section className={cn('flex min-h-0 flex-col', mobileTab === 'board' ? 'flex' : 'hidden', 'lg:flex')}>
          {draft.settings.finale === 'season82' && hasHuman && (
            <PerfectMeter roster={focusRoster} seed={finaleSeed} size={draft.settings.rounds} teamNames={draft.teams.map((t) => t.name)} />
          )}
          <div className="min-h-0 flex-1">{board}</div>
        </section>
        <aside className={cn('min-h-0 pb-16 lg:pb-0', mobileTab === 'scout' ? 'block' : 'hidden', 'lg:block')}>{scout}</aside>
      </div>

      <div className="hidden border-t border-white/10 bg-black/30 px-4 py-1.5 lg:block">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 overflow-hidden whitespace-nowrap font-cond text-[13px] font-semibold uppercase tracking-wider">
          <span className="rounded bg-primary px-2 py-0.5 text-[11.5px] font-bold tracking-widest text-primary-foreground">Live</span>
          {recent.length === 0 && <span className="text-muted-foreground">The draft is about to begin</span>}
          {recent.map((pk, i) => {
            const p = getPlayer(pk.playerId)
            const t = draft.teams[pk.team]
            return (
              <span key={pk.overall} className={cn('flex items-center gap-1.5', i === 0 ? 'text-white' : 'text-white/45')}>
                <TeamAvatar icon={t.icon} color={t.color} size={18} />
                #{pk.overall + 1} {t.owner}: <b className="text-white/90">{p.name}</b> ({p.ovr})
                {i < recent.length - 1 && <span className="ml-2 text-white/20">|</span>}
              </span>
            )
          })}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0b1d]/95 backdrop-blur-md lg:hidden" aria-label="Draft panels">
        {selectedPlayer && humanTurn && mobileTab !== 'scout' && (
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-display text-lg uppercase text-white">{selectedPlayer.name}</span>
            <Button size="sm" disabled={!(offerItem?.ok ?? false)} onClick={() => doDraft(selectedPlayer.id)} className="gap-1.5 font-display uppercase">
              <Check className="size-4" /> Draft
            </Button>
          </div>
        )}
        <div className="grid grid-cols-3">
          {(['board', 'scout', 'order'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMobileTab(t)}
              className={cn('py-3 font-cond text-[14px] font-bold uppercase tracking-wider', mobileTab === t ? 'bg-white/10 text-white' : 'text-muted-foreground')}
            >
              {t === 'board' ? 'Board' : t === 'scout' ? 'Scout & Roster' : 'Order'}
            </button>
          ))}
        </div>
      </nav>

      <PickAnnouncement draft={draft} quick={fast} />
      <TurnSplash draft={draft} quick={fast} />

      <AnimatePresence>{draft.phase === 'intro' && <RoundIntro key={`intro-${cur?.round}`} draft={draft} onGo={startRound} />}</AnimatePresence>
      <AnimatePresence>{draft.phase === 'reveal' && <RoundReveal key={`reveal-${draft.picks.length}`} draft={draft} onNext={ackReveal} />}</AnimatePresence>

      <AnimatePresence>
        {draft.phase === 'done' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 grid place-items-center bg-[#07050f]/90 backdrop-blur-md"
          >
            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }} className="text-center">
              <Flag className="mx-auto size-14 text-primary" />
              <div className="mt-3 font-display text-6xl uppercase text-white sm:text-8xl">That&apos;s a wrap</div>
              <div className="mt-2 font-cond text-xl font-semibold uppercase tracking-[0.3em] text-muted-foreground">The draft is complete</div>
              {lastPick && <div className="mt-6 font-cond text-lg uppercase tracking-wider text-white/60">Building your reports…</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
