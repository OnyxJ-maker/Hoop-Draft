import { useState } from 'react'
import { Crown, Trash2, Trophy } from 'lucide-react'
import { AppBar } from '@/components/AppBar'
import { OvrBadge, TeamAvatar } from '@/components/bits'
import { Panel } from '@/components/controls'
import { Button } from '@/components/ui/button'
import { getPlayer } from '@/data/players'
import { FORMATS, type FormatId } from '@/engine/formats'
import { useGame } from '@/store/game'
import { useSettings, type HofEntry } from '@/store/settings'

function Entry({ e }: { e: HofEntry }) {
  const roster = e.roster
    .map((id) => {
      try {
        return getPlayer(id)
      } catch {
        return null
      }
    })
    .filter((p): p is NonNullable<typeof p> => !!p)
    .sort((a, b) => b.ovr - a.ovr)
  const fmt = FORMATS[e.format as FormatId]?.name ?? e.format
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <div className="flex items-center gap-3">
        <TeamAvatar icon={e.icon} color={e.color} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-xl uppercase leading-none text-white">{e.teamName}</div>
          <div className="truncate font-cond text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            {e.owner} · {fmt} · {new Date(e.date).toLocaleDateString()}
          </div>
        </div>
        {e.kind === 'season82' ? (
          <div className={`font-display text-4xl leading-none ${e.perfect ? 'text-lime-300' : 'text-white'}`}>
            {e.wins}–{e.losses}
          </div>
        ) : (
          <Trophy className="size-7 text-amber-300" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {roster.slice(0, 8).map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 rounded-md bg-black/25 py-0.5 pl-0.5 pr-2">
            <OvrBadge player={p} className="h-5 min-w-7 text-[13px]" />
            <span className="font-cond text-[12.5px] font-bold uppercase text-white/85">{p.name.split(' ').slice(-1)[0]}</span>
          </span>
        ))}
      </div>
      {e.note && <div className="mt-1.5 font-cond text-[12.5px] font-semibold uppercase tracking-wide text-white/50">{e.note}</div>}
    </li>
  )
}

export function HallOfFameScreen() {
  const hof = useSettings((s) => s.hof)
  const clear = useSettings((s) => s.clearHof)
  const goto = useGame((s) => s.goto)
  const [confirm, setConfirm] = useState(false)

  const seasons = hof.filter((h) => h.kind === 'season82').sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0) || b.date - a.date)
  const champs = hof.filter((h) => h.kind === 'champion').sort((a, b) => b.date - a.date)
  const perfect = seasons.filter((s) => s.perfect)

  return (
    <div className="min-h-screen pb-16">
      <AppBar title="Hall of fame" onBack={() => goto('menu')} showQuit={false} />
      <main className="mx-auto max-w-5xl space-y-5 px-4 pt-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Perfect seasons', value: perfect.length, icon: <Crown className="size-6 text-lime-300" /> },
            { label: '82-game runs', value: seasons.length, icon: <Trophy className="size-6 text-primary" /> },
            { label: 'League titles', value: champs.length, icon: <Trophy className="size-6 text-amber-300" /> },
          ].map((s) => (
            <div key={s.label} className="glass flex items-center gap-4 rounded-2xl p-4">
              {s.icon}
              <div>
                <div className="font-display text-4xl leading-none text-white">{s.value}</div>
                <div className="font-cond text-[13px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {hof.length === 0 ? (
          <Panel>
            <div className="py-10 text-center">
              <Trophy className="mx-auto size-12 text-white/25" />
              <div className="mt-3 font-display text-3xl uppercase text-white">No legends yet</div>
              <p className="mx-auto mt-1 max-w-md text-muted-foreground">Win a league title or finish an 82-game season on this device and your team lands here forever.</p>
            </div>
          </Panel>
        ) : (
          <>
            {seasons.length > 0 && (
              <Panel title="Best 82-game seasons">
                <ul className="grid gap-3 md:grid-cols-2">
                  {seasons.slice(0, 10).map((e) => (
                    <Entry key={e.id} e={e} />
                  ))}
                </ul>
              </Panel>
            )}
            {champs.length > 0 && (
              <Panel title="League champions">
                <ul className="grid gap-3 md:grid-cols-2">
                  {champs.slice(0, 12).map((e) => (
                    <Entry key={e.id} e={e} />
                  ))}
                </ul>
              </Panel>
            )}
            <div className="text-center">
              {confirm ? (
                <div className="inline-flex items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3">
                  <span className="text-sm">Erase every record?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      clear()
                      setConfirm(false)
                    }}
                  >
                    Yes, erase
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => setConfirm(true)}>
                  <Trash2 className="size-4" /> Clear records
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
