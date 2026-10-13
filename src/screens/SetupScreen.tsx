import { motion } from 'motion/react'
import { Bot, Dices, Play, Plus, Trash2, Users } from 'lucide-react'
import { AppBar } from '@/components/AppBar'
import { Icon } from '@/components/Icon'
import { TeamAvatar } from '@/components/bits'
import { Field, Panel, Segmented } from '@/components/controls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { TEAM_COLORS } from '@/data/franchises'
import { validateSetup } from '@/engine/draft'
import { DIFFICULTY_LABEL, FORMATS, SEASON82_FORMATS, type Difficulty, type FormatId } from '@/engine/formats'
import { POOLS, poolPlayers } from '@/engine/pool'
import { sfx } from '@/audio/sfx'
import { capFor, MAX_TEAMS, useGame } from '@/store/game'
import { cn } from '@/lib/utils'

export function SetupScreen() {
  const setup = useGame((s) => s.setup)
  const goto = useGame((s) => s.goto)
  const patchSetup = useGame((s) => s.patchSetup)
  const addHuman = useGame((s) => s.addHuman)
  const removeHuman = useGame((s) => s.removeHuman)
  const patchHuman = useGame((s) => s.patchHuman)
  const rerollTeamName = useGame((s) => s.rerollTeamName)
  const startDraft = useGame((s) => s.startDraft)

  const f = FORMATS[setup.format]
  const teamCount = setup.humans.length + setup.cpuCount
  const validation = validateSetup({ format: setup.format, rounds: setup.rounds, pool: setup.pool }, teamCount)
  const needsTwo = setup.mode === 'draft' && teamCount < 2
  const canStart = validation.ok && !needsTwo
  const totalPicks = teamCount * setup.rounds
  const maxCpu = MAX_TEAMS - setup.humans.length
  const isSolo = setup.humans.length === 1

  const nextColor = (id: string, current: string) => {
    const used = setup.humans.filter((h) => h.id !== id).map((h) => h.color)
    const options = TEAM_COLORS.filter((c) => !used.includes(c))
    const idx = options.indexOf(current)
    patchHuman(id, { color: options[(idx + 1) % options.length] ?? current })
  }

  return (
    <div className="min-h-screen pb-28">
      <AppBar
        title={setup.mode === 'season82' ? '82-0 · Setup' : `${f.name} · Setup`}
        onBack={() => goto(setup.mode === 'season82' ? 'menu' : 'formats')}
        showQuit={false}
      />
      <main className="mx-auto grid max-w-6xl gap-5 px-4 pt-6 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-5">
          <Panel
            title="Who's playing?"
            icon={<Users className="size-5 text-primary" />}
            right={
              <span className="font-cond text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                {setup.humans.length} human{setup.humans.length === 1 ? '' : 's'}
              </span>
            }
          >
            <div className="space-y-2.5">
              {setup.humans.map((h, i) => (
                <motion.div
                  layout
                  key={h.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 p-2.5 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)_auto]"
                >
                  <button
                    type="button"
                    aria-label="Change team color"
                    title="Click to change color"
                    onClick={() => nextColor(h.id, h.color)}
                    className="rounded-full transition-transform hover:scale-110"
                  >
                    <TeamAvatar icon={h.icon} color={h.color} size={42} />
                  </button>
                  <Input
                    value={h.owner}
                    maxLength={18}
                    aria-label={`Player ${i + 1} name`}
                    onChange={(e) => patchHuman(h.id, { owner: e.target.value })}
                    placeholder={`Player ${i + 1}`}
                    className="h-10 border-white/15 bg-white/5 font-cond text-lg font-bold uppercase tracking-wide"
                  />
                  <div className="col-span-3 flex items-center gap-1.5 sm:col-span-1">
                    <Input
                      value={h.teamName}
                      maxLength={26}
                      aria-label={`Player ${i + 1} team name`}
                      onChange={(e) => patchHuman(h.id, { teamName: e.target.value })}
                      placeholder="Team name"
                      className="h-10 border-white/15 bg-white/5"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-10 shrink-0 border-white/15 bg-white/5"
                      aria-label="Random team name"
                      title="Random team name"
                      onClick={() => {
                        sfx.click()
                        rerollTeamName(h.id)
                      }}
                    >
                      <Dices className="size-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={setup.humans.length <= 1}
                    aria-label="Remove player"
                    className="size-10 text-white/60 hover:text-red-300"
                    onClick={() => removeHuman(h.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-3 w-full gap-2 border-dashed border-white/25 bg-transparent font-cond text-[15px] font-bold uppercase tracking-wider"
              disabled={teamCount >= MAX_TEAMS && setup.cpuCount === 0}
              onClick={() => {
                sfx.click()
                addHuman()
              }}
            >
              <Plus className="size-4" /> Add a player
            </Button>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {isSolo
                ? 'Playing solo? You will draft against CPU GMs. Add friends to pass the device around.'
                : 'Hot-seat multiplayer: everyone shares this screen and takes turns on the clock.'}
            </p>
          </Panel>

          <Panel title="CPU GMs" icon={<Bot className="size-5 text-primary" />}>
            <Field label="CPU opponents" hint={`${setup.cpuCount} CPU · ${teamCount} teams total`}>
              <Slider
                value={[setup.cpuCount]}
                min={0}
                max={Math.max(0, maxCpu)}
                step={1}
                onValueChange={(v) => patchSetup({ cpuCount: v[0] })}
                aria-label="CPU opponents"
              />
            </Field>
            <Field label="CPU skill" className="mt-4">
              <Segmented<Difficulty>
                value={setup.difficulty}
                onChange={(v) => patchSetup({ difficulty: v })}
                options={(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => ({
                  value: d,
                  label: DIFFICULTY_LABEL[d].label.replace(' GMs', ''),
                  hint: DIFFICULTY_LABEL[d].blurb,
                }))}
              />
              <p className="text-[13px] text-muted-foreground">{DIFFICULTY_LABEL[setup.difficulty].blurb}</p>
            </Field>
            {needsTwo && <p className="mt-3 text-sm font-semibold text-amber-300">This mode needs at least 2 teams. Add a CPU or another player.</p>}
          </Panel>
        </div>

        <div className="space-y-5">
          {setup.mode === 'season82' && (
            <Panel title="Draft style">
              <Segmented<FormatId>
                value={setup.format}
                onChange={(v) => patchSetup({ format: v })}
                options={SEASON82_FORMATS.map((id) => ({ value: id, label: FORMATS[id].name.replace(' League Draft', '').replace(' Draft', ''), hint: FORMATS[id].tagline }))}
              />
              <p className="mt-2 text-[13.5px] text-white/75">{f.description}</p>
            </Panel>
          )}

          <Panel title="Rules">
            <div className="space-y-5">
              <Field label="Roster size" hint={`${setup.rounds} players · ${totalPicks} total picks`}>
                <Slider
                  value={[setup.rounds]}
                  min={f.minRounds}
                  max={f.maxRounds}
                  step={1}
                  onValueChange={(v) => patchSetup({ rounds: v[0] })}
                  aria-label="Roster size"
                />
              </Field>

              <Field label="Player pool" hint={`${poolPlayers(setup.pool).length} players`}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {POOLS.map((p) => {
                    const check = validateSetup({ format: setup.format, rounds: setup.rounds, pool: p.id }, teamCount)
                    const active = setup.pool === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!check.ok}
                        onClick={() => patchSetup({ pool: p.id })}
                        title={check.ok ? p.blurb : check.reason}
                        className={cn(
                          'flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition-all',
                          active ? 'border-primary bg-primary/15 shadow-[0_0_20px_-8px_var(--primary)]' : 'border-white/10 bg-black/20 hover:bg-white/10',
                          !check.ok && 'cursor-not-allowed opacity-35',
                        )}
                      >
                        <span className="flex items-center gap-1.5 font-cond text-[14px] font-bold uppercase tracking-wide text-white">
                          <Icon name={p.icon} className="size-3.5 text-primary" /> {p.label}
                        </span>
                        <span className="text-[12px] leading-tight text-muted-foreground">{p.blurb}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>

              <Field label="Pick timer" hint="Auto-picks when time runs out">
                <Segmented
                  value={setup.shotClock}
                  onChange={(v) => patchSetup({ shotClock: v })}
                  options={[
                    { value: 0, label: 'Off' },
                    { value: 20, label: '20s' },
                    { value: 45, label: '45s' },
                    { value: 90, label: '90s' },
                  ]}
                />
              </Field>

              {setup.format === 'pack' && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Mulligans" hint="Re-roll a pack">
                    <Segmented
                      value={setup.mulligans}
                      onChange={(v) => patchSetup({ mulligans: v })}
                      options={[0, 1, 2, 3, 5].map((n) => ({ value: n, label: String(n) }))}
                    />
                  </Field>
                  <Field label="Pack size">
                    <Segmented
                      value={setup.packSize}
                      onChange={(v) => patchSetup({ packSize: v })}
                      options={[4, 5, 6, 7].map((n) => ({ value: n, label: String(n) }))}
                    />
                  </Field>
                </div>
              )}

              {setup.format === 'cap' && (
                <Field label="Salary cap" hint={`$${capFor(setup.rounds, setup.capLevel)}M per team`}>
                  <Segmented
                    value={setup.capLevel}
                    onChange={(v) => patchSetup({ capLevel: v })}
                    options={[
                      { value: 'tight', label: 'Tight' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'loose', label: 'Loose' },
                    ]}
                  />
                </Field>
              )}

              {setup.mode === 'draft' && (
                <>
                  <Field label="Crown the champion with">
                    <Segmented
                      value={setup.finale}
                      onChange={(v) => patchSetup({ finale: v })}
                      options={[
                        { value: 'league', label: 'Season + Playoffs' },
                        { value: 'showdown', label: 'Showdown Bracket' },
                      ]}
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Playoff series">
                      <Segmented
                        value={setup.bestOf}
                        onChange={(v) => patchSetup({ bestOf: v })}
                        options={[
                          { value: 1, label: '1 game' },
                          { value: 3, label: 'Bo3' },
                          { value: 5, label: 'Bo5' },
                          { value: 7, label: 'Bo7' },
                        ]}
                      />
                    </Field>
                    {setup.finale === 'league' && (
                      <Field label="Season length" hint="Games per matchup">
                        <Segmented
                          value={setup.seasonRepeats}
                          onChange={(v) => patchSetup({ seasonRepeats: v })}
                          options={[
                            { value: 1, label: 'Short' },
                            { value: 2, label: 'Standard' },
                            { value: 4, label: 'Long' },
                          ]}
                        />
                      </Field>
                    )}
                  </div>
                </>
              )}
            </div>
          </Panel>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0b1d]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-xl uppercase leading-none text-white sm:text-2xl">
              {teamCount} teams · {setup.rounds} rounds · {totalPicks} picks
            </div>
            <div className={cn('truncate font-cond text-[13px] font-semibold uppercase tracking-wider', canStart ? 'text-muted-foreground' : 'text-amber-300')}>
              {canStart ? `${f.name}${setup.mode === 'season82' ? ' → 82-game season' : ''}` : needsTwo ? 'Need at least 2 teams' : validation.reason}
            </div>
          </div>
          <Button
            size="lg"
            disabled={!canStart}
            onClick={() => {
              sfx.whistle()
              startDraft()
            }}
            className="h-12 gap-2 px-8 font-display text-xl uppercase tracking-wide shadow-[0_0_30px_-6px_var(--primary)]"
          >
            <Play className="size-5 fill-current" /> Start draft
          </Button>
        </div>
      </div>
    </div>
  )
}
