import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  FRANCHISES,
  GM_PERSONAS,
  TEAM_COLORS,
  TEAM_ICONS,
  franchiseName,
  pickFranchises,
} from '@/data/franchises'
import { cpuChoose } from '@/engine/cpu'
import {
  ackReveal,
  createDraft,
  currentPick,
  makePick,
  startRound,
  takeMulligan,
  type DraftSettings,
  type DraftState,
  type TeamSetup,
} from '@/engine/draft'
import {
  FORMATS,
  type Difficulty,
  type Finale,
  type FormatId,
  type GameMode,
} from '@/engine/formats'
import type { PoolId } from '@/engine/pool'
import { randomSeed, rngFor, shuffle } from '@/engine/rng'

export type Screen = 'menu' | 'formats' | 'setup' | 'lottery' | 'draft' | 'recap' | 'finale' | 'hof'

export interface HumanSetup {
  id: string
  owner: string
  teamName: string
  color: string
  icon: string
}

export type CapLevel = 'tight' | 'normal' | 'loose'

export interface SetupState {
  mode: GameMode
  format: FormatId
  humans: HumanSetup[]
  cpuCount: number
  rounds: number
  finale: Finale
  pool: PoolId
  difficulty: Difficulty
  shotClock: number
  bestOf: 1 | 3 | 5 | 7
  seasonRepeats: number
  mulligans: number
  packSize: number
  capLevel: CapLevel
}

export const MAX_TEAMS = 16

const uid = () => Math.random().toString(36).slice(2, 9)

function randomTeamIdentity(used: string[] = []): { name: string; icon: string } {
  const pool = FRANCHISES.filter((f) => !used.includes(franchiseName(f)))
  const f = pool[Math.floor(Math.random() * pool.length)] ?? FRANCHISES[0]
  return { name: franchiseName(f), icon: f.icon }
}

function newHuman(index: number, existing: HumanSetup[]): HumanSetup {
  const usedColors = existing.map((h) => h.color)
  const color = TEAM_COLORS.find((c) => !usedColors.includes(c)) ?? TEAM_COLORS[index % TEAM_COLORS.length]
  const ident = randomTeamIdentity(existing.map((h) => h.teamName))
  return { id: uid(), owner: `Player ${index + 1}`, teamName: ident.name, color, icon: ident.icon }
}

export function defaultSetup(mode: GameMode, format: FormatId): SetupState {
  const f = FORMATS[format]
  const humans = [newHuman(0, [])]
  return {
    mode,
    format,
    humans,
    cpuCount: mode === 'season82' ? 3 : 3,
    rounds: f.defaultRounds,
    finale: mode === 'season82' ? 'season82' : f.defaultFinale,
    pool: 'all',
    difficulty: 'pro',
    shotClock: 0,
    bestOf: 7,
    seasonRepeats: 2,
    mulligans: 2,
    packSize: 5,
    capLevel: 'normal',
  }
}

export function capFor(rounds: number, level: CapLevel): number {
  const mult = level === 'tight' ? 0.85 : level === 'loose' ? 1.2 : 1
  return Math.round(rounds * 13.5 * mult)
}

interface GameStore {
  screen: Screen
  setup: SetupState
  draft: DraftState | null
  finaleSeed: number
  resumeScreen: Screen | null

  goto: (screen: Screen) => void
  pickMode: (mode: GameMode) => void
  pickFormat: (format: FormatId) => void
  patchSetup: (patch: Partial<SetupState>) => void
  addHuman: () => void
  removeHuman: (id: string) => void
  patchHuman: (id: string, patch: Partial<HumanSetup>) => void
  rerollTeamName: (id: string) => void
  startDraft: () => void
  beginDraft: () => void
  humanPick: (playerId: string) => void
  clockPick: () => void
  cpuStep: () => void
  simAhead: () => void
  mulligan: () => void
  startRound: () => void
  ackReveal: () => void
  finishDraft: () => void
  toFinale: () => void
  resume: () => void
  endGame: () => void
}

function normalizeSetup(setup: SetupState): SetupState {
  const f = FORMATS[setup.format]
  const rounds = Math.max(f.minRounds, Math.min(f.maxRounds, setup.rounds))
  const maxCpu = Math.max(0, MAX_TEAMS - setup.humans.length)
  const cpuCount = Math.max(0, Math.min(maxCpu, setup.cpuCount))
  return { ...setup, rounds, cpuCount }
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: 'menu',
      setup: defaultSetup('draft', 'snake'),
      draft: null,
      finaleSeed: 1,
      resumeScreen: null,

      goto: (screen) => {
        const draft = get().draft
        set({ screen, resumeScreen: screen !== 'menu' && draft ? screen : get().resumeScreen })
      },

      pickMode: (mode) => {
        if (mode === 'season82') {
          set({ setup: defaultSetup('season82', 'pack'), screen: 'setup' })
        } else {
          set({ screen: 'formats' })
        }
      },

      pickFormat: (format) => {
        set({ setup: defaultSetup('draft', format), screen: 'setup' })
      },

      patchSetup: (patch) => {
        const next = { ...get().setup, ...patch }
        if (patch.format && patch.format !== get().setup.format) {
          const f = FORMATS[patch.format]
          next.rounds = f.defaultRounds
          next.finale = next.mode === 'season82' ? 'season82' : f.defaultFinale
        }
        set({ setup: normalizeSetup(next) })
      },

      addHuman: () => {
        const { setup } = get()
        if (setup.humans.length + setup.cpuCount >= MAX_TEAMS) {
          if (setup.cpuCount > 0) {
            set({
              setup: normalizeSetup({
                ...setup,
                cpuCount: setup.cpuCount - 1,
                humans: [...setup.humans, newHuman(setup.humans.length, setup.humans)],
              }),
            })
          }
          return
        }
        set({ setup: { ...setup, humans: [...setup.humans, newHuman(setup.humans.length, setup.humans)] } })
      },

      removeHuman: (id) => {
        const { setup } = get()
        if (setup.humans.length <= 1) return
        set({ setup: { ...setup, humans: setup.humans.filter((h) => h.id !== id) } })
      },

      patchHuman: (id, patch) => {
        const { setup } = get()
        set({ setup: { ...setup, humans: setup.humans.map((h) => (h.id === id ? { ...h, ...patch } : h)) } })
      },

      rerollTeamName: (id) => {
        const { setup } = get()
        const used = setup.humans.filter((h) => h.id !== id).map((h) => h.teamName)
        const ident = randomTeamIdentity(used)
        set({
          setup: { ...setup, humans: setup.humans.map((h) => (h.id === id ? { ...h, teamName: ident.name, icon: ident.icon } : h)) },
        })
      },

      startDraft: () => {
        const { setup } = get()
        const seed = randomSeed()
        const rng = rngFor('setup', seed)
        const humans: TeamSetup[] = setup.humans.map((h, i) => ({
          id: h.id,
          name: h.teamName.trim() || `${h.owner.trim() || `Player ${i + 1}`}'s Squad`,
          owner: h.owner.trim() || `Player ${i + 1}`,
          human: true,
          color: h.color,
          icon: TEAM_ICONS.includes(h.icon) ? h.icon : h.icon,
        }))
        const humanNames = humans.map((h) => h.name)
        const cpuFranchises = pickFranchises(rng, setup.cpuCount + 4).filter((f) => !humanNames.includes(franchiseName(f)))
        const personas = shuffle(rng, GM_PERSONAS)
        const cpus: TeamSetup[] = cpuFranchises.slice(0, setup.cpuCount).map((f, i) => {
          const persona = personas[i % personas.length]
          return {
            id: `cpu-${f.id}`,
            name: franchiseName(f),
            owner: persona.name,
            human: false,
            color: f.color,
            icon: f.icon,
            gm: persona.style,
          }
        })
        const settings: DraftSettings = {
          format: setup.format,
          finale: setup.mode === 'season82' ? 'season82' : setup.finale,
          rounds: setup.rounds,
          pool: setup.pool,
          difficulty: setup.difficulty,
          shotClock: setup.shotClock,
          bestOf: setup.bestOf,
          seasonRepeats: setup.seasonRepeats,
          mulligans: setup.mulligans,
          packSize: setup.packSize,
          cap: capFor(setup.rounds, setup.capLevel),
          seed,
        }
        const draft = createDraft(settings, [...humans, ...cpus])
        set({ draft, finaleSeed: seed, screen: 'lottery', resumeScreen: 'lottery' })
      },

      beginDraft: () => set({ screen: 'draft', resumeScreen: 'draft' }),

      humanPick: (playerId) => {
        const { draft } = get()
        if (!draft) return
        const cur = currentPick(draft)
        if (!cur || !draft.teams[cur.team].human) return
        set({ draft: makePick(draft, playerId, 'human') })
      },

      clockPick: () => {
        const { draft } = get()
        if (!draft) return
        const cur = currentPick(draft)
        if (!cur) return
        const id = cpuChoose(draft, rngFor('clock', draft.settings.seed, cur.overall), { difficulty: 'goat' })
        if (id) set({ draft: makePick(draft, id, 'clock') })
      },

      cpuStep: () => {
        const { draft } = get()
        if (!draft) return
        const cur = currentPick(draft)
        if (!cur || draft.phase !== 'pick' || draft.teams[cur.team].human) return
        const id = cpuChoose(draft, rngFor('cpu', draft.settings.seed, cur.overall))
        if (id) set({ draft: makePick(draft, id, 'cpu') })
      },

      simAhead: () => {
        let d = get().draft
        if (!d) return
        let guard = 0
        while (d.phase === 'pick' && guard++ < 600) {
          const cur = currentPick(d)
          if (!cur || d.teams[cur.team].human) break
          const id = cpuChoose(d, rngFor('cpu', d.settings.seed, cur.overall))
          if (!id) break
          d = makePick(d, id, 'cpu')
        }
        set({ draft: d })
      },

      mulligan: () => {
        const { draft } = get()
        if (!draft) return
        set({ draft: takeMulligan(draft) })
      },

      startRound: () => {
        const { draft } = get()
        if (draft) set({ draft: startRound(draft) })
      },

      ackReveal: () => {
        const { draft } = get()
        if (draft) set({ draft: ackReveal(draft) })
      },

      finishDraft: () => set({ screen: 'recap', resumeScreen: 'recap' }),

      toFinale: () => set({ screen: 'finale', resumeScreen: 'finale' }),

      resume: () => {
        const { resumeScreen, draft } = get()
        if (draft && resumeScreen) set({ screen: resumeScreen })
      },

      endGame: () => set({ draft: null, resumeScreen: null, screen: 'menu' }),
    }),
    {
      name: 'hoop-draft-game-v1',
      version: 1,
      partialize: (state) => ({
        setup: state.setup,
        draft: state.draft,
        finaleSeed: state.finaleSeed,
        resumeScreen: state.resumeScreen,
      }),
    },
  ),
)
