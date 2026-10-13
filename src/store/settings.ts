import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setSoundEnabled } from '@/audio/sfx'
import type { GameMode } from '@/engine/formats'

export interface HofEntry {
  id: string
  date: number
  mode: GameMode
  kind: 'season82' | 'champion'
  owner: string
  teamName: string
  color: string
  icon: string
  wins?: number
  losses?: number
  perfect?: boolean
  power: number
  roster: string[]
  format: string
  note?: string
}

interface SettingsState {
  sound: boolean
  fast: boolean
  hof: HofEntry[]
  toggleSound: () => void
  toggleFast: () => void
  addHof: (entry: HofEntry) => void
  clearHof: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      sound: true,
      fast: false,
      hof: [],
      toggleSound: () => {
        const sound = !get().sound
        setSoundEnabled(sound)
        set({ sound })
      },
      toggleFast: () => set({ fast: !get().fast }),
      addHof: (entry) => {
        const exists = get().hof.some((h) => h.id === entry.id)
        if (exists) return
        set({ hof: [entry, ...get().hof].slice(0, 60) })
      },
      clearHof: () => set({ hof: [] }),
    }),
    {
      name: 'hoop-draft-settings-v1',
      onRehydrateStorage: () => (state) => {
        if (state) setSoundEnabled(state.sound)
      },
    },
  ),
)
