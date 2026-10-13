export type FormatId = 'snake' | 'ball-knowledge' | 'pack' | 'starting-five' | 'time-machine' | 'cap'
export type Finale = 'league' | 'showdown' | 'season82'
export type Difficulty = 'rookie' | 'pro' | 'allstar' | 'goat'
export type GameMode = 'season82' | 'draft'

export interface FormatDef {
  id: FormatId
  name: string
  tagline: string
  description: string
  rules: string[]
  icon: string
  accent: string
  defaultRounds: number
  minRounds: number
  maxRounds: number
  defaultFinale: Finale
  themed: boolean
}

export const FORMATS: Record<FormatId, FormatDef> = {
  snake: {
    id: 'snake',
    name: 'Snake League Draft',
    tagline: 'The classic. Build a roster, win the league.',
    description:
      'A real snake draft for a league of you, your friends, and CPU GMs. Pick order reverses every round. Then a full season and playoffs crown the champion.',
    rules: [
      'Open board: any player still available can be drafted',
      'Pick order snakes: 1 to N, then N to 1',
      'Full regular season, then playoffs',
    ],
    icon: 'Trophy',
    accent: '#ff7a1a',
    defaultRounds: 10,
    minRounds: 5,
    maxRounds: 13,
    defaultFinale: 'league',
    themed: false,
  },
  'ball-knowledge': {
    id: 'ball-knowledge',
    name: 'Ball Knowledge',
    tagline: 'Hot-take prompts. Eight rounds. Eight players.',
    description:
      'Every round has a prompt: Most Unguardable, Most Predatorial Defender, Looks Like a Cartoon Character... A pool of players is dealt, you pick who fits best. Nail the prompts AND build the best team.',
    rules: [
      'Each round reveals a prompt and deals a shared pool of players',
      'Pick the player who best answers the prompt',
      'The game scores your read after every round',
      'Ball Knowledge IQ gives your team a chemistry boost',
    ],
    icon: 'Brain',
    accent: '#f43f9d',
    defaultRounds: 8,
    minRounds: 5,
    maxRounds: 10,
    defaultFinale: 'showdown',
    themed: true,
  },
  pack: {
    id: 'pack',
    name: 'Pack Rip',
    tagline: 'Open a pack. Keep one. Repeat.',
    description:
      'Every pick you rip open a fresh pack of random players and keep exactly one. No pool fights, pure luck meets pure judgment. Use your mulligans wisely.',
    rules: [
      'Each pick: a brand new pack of random players',
      'Keep one, the rest go back in the box',
      'Limited mulligans to re-roll a bad pack',
    ],
    icon: 'Package',
    accent: '#22d3ee',
    defaultRounds: 8,
    minRounds: 5,
    maxRounds: 13,
    defaultFinale: 'showdown',
    themed: false,
  },
  'starting-five': {
    id: 'starting-five',
    name: 'Starting Five',
    tagline: 'PG, SG, SF, PF, C. Positions are real.',
    description:
      'Fill a real starting five plus a bench. Each player can only slot into the positions he plays. You cannot stack five centers and hope for the best.',
    rules: [
      'Roster slots: PG, SG, SF, PF, C + bench',
      'Players only fit the positions they play',
      'Bench spots take anybody',
    ],
    icon: 'LayoutGrid',
    accent: '#a3e635',
    defaultRounds: 8,
    minRounds: 6,
    maxRounds: 13,
    defaultFinale: 'league',
    themed: false,
  },
  'time-machine': {
    id: 'time-machine',
    name: 'Time Machine',
    tagline: 'A different decade every round.',
    description:
      'Each round travels to a new era and you can only draft players who peaked in that decade. Hand-pick the 60s, the 90s, the 2010s, and everything in between.',
    rules: [
      'Each round is locked to one decade',
      'Only players whose prime overlapped it are eligible',
      'Build a team across the ages',
    ],
    icon: 'History',
    accent: '#fbbf24',
    defaultRounds: 8,
    minRounds: 5,
    maxRounds: 10,
    defaultFinale: 'showdown',
    themed: true,
  },
  cap: {
    id: 'cap',
    name: 'Cap Crunch',
    tagline: 'Same budget. Every star has a price.',
    description:
      'Every player has a price tag and every team gets the same salary cap. Superstars eat your budget. Can you find value on defensive specialists and cheap role players?',
    rules: [
      'Everyone gets the same budget',
      'You must leave enough to fill your roster',
      'Defense-first guys are cheaper than they should be',
    ],
    icon: 'Coins',
    accent: '#8b5cf6',
    defaultRounds: 8,
    minRounds: 5,
    maxRounds: 13,
    defaultFinale: 'league',
    themed: false,
  },
}

export const FORMAT_ORDER: FormatId[] = ['snake', 'ball-knowledge', 'pack', 'starting-five', 'time-machine', 'cap']

export const SEASON82_FORMATS: FormatId[] = ['pack', 'snake', 'cap', 'starting-five', 'time-machine']

export const DIFFICULTY_LABEL: Record<Difficulty, { label: string; blurb: string }> = {
  rookie: { label: 'Rookie GMs', blurb: 'Makes human-level mistakes. Easy to beat.' },
  pro: { label: 'Pro GMs', blurb: 'Solid picks with the odd reach.' },
  allstar: { label: 'All-Star GMs', blurb: 'Sharp. Fills needs and finds value.' },
  goat: { label: 'GOAT GMs', blurb: 'Ruthless. Takes exactly the right player.' },
}

export const SLOT_ORDER = ['PG', 'SG', 'SF', 'PF', 'C'] as const
