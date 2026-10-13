import type { Player, TagKey } from '@/engine/types'

export type PromptKind = 'vibes' | 'stats'

export interface Prompt {
  id: string
  title: string
  tagline: string
  icon: string
  kind: PromptKind
  fit: (p: Player) => number
  /** Optional factual line shown during the reveal ("11 rings"). */
  fact?: (p: Player) => string
}

const clamp100 = (n: number) => Math.max(0, Math.min(100, n))
const tag = (p: Player, k: TagKey) => ((p.tags[k] ?? 0) / 3) * 100
const scale = (v: number, lo: number, hi: number) => clamp100(((v - lo) / (hi - lo)) * 100)

const scoring = (p: Player) =>
  Math.max(p.attrs.fin, p.attrs.sht) * 0.6 + Math.min(p.attrs.fin, p.attrs.sht) * 0.1 + p.attrs.hnd * 0.15 + p.attrs.ath * 0.15
const defense = (p: Player) => Math.max(p.attrs.prd, p.attrs.ind) * 0.6 + p.attrs.ath * 0.2 + p.attrs.iq * 0.2

export const PROMPTS: Prompt[] = [
  {
    id: 'unguardable',
    title: 'Most Unguardable',
    tagline: 'Nobody on earth has an answer. Not even a double team.',
    icon: 'Flame',
    kind: 'vibes',
    fit: (p) => 0.5 * tag(p, 'unguardable') + 0.5 * scale(scoring(p), 68, 96),
  },
  {
    id: 'predator',
    title: 'Most Predatorial Defender',
    tagline: 'Hunts the ball. Smells fear. Eats pick-and-rolls for breakfast.',
    icon: 'Crosshair',
    kind: 'vibes',
    fit: (p) => 0.58 * tag(p, 'predator') + 0.42 * scale(defense(p), 66, 98),
  },
  {
    id: 'cartoon',
    title: 'Looks Like a Cartoon Character',
    tagline: 'Proportions, hair, vibes. This guy belongs in Saturday morning TV.',
    icon: 'Drama',
    kind: 'vibes',
    fit: (p) => clamp100(0.92 * tag(p, 'cartoon') + (p.ht >= 88 || p.ht <= 66 ? 10 : 0)),
  },
  {
    id: 'tough',
    title: 'Would Win a Street Fight',
    tagline: 'No refs. No rules. Parking lot behind the arena.',
    icon: 'Swords',
    kind: 'vibes',
    fit: (p) => clamp100(0.8 * tag(p, 'tough') + 0.2 * tag(p, 'bully')),
  },
  {
    id: 'dunker',
    title: 'Best Dunker (Poster Maker)',
    tagline: 'Rim is a suggestion. Defenders are speed bumps.',
    icon: 'Rocket',
    kind: 'vibes',
    fit: (p) => 0.55 * tag(p, 'dunker') + 0.45 * scale(p.attrs.ath, 68, 99),
  },
  {
    id: 'clutch',
    title: 'Hit the Last Shot',
    tagline: 'Down one. Four seconds left. Whose hands do you want it in?',
    icon: 'Timer',
    kind: 'vibes',
    fit: (p) => clamp100(0.82 * tag(p, 'clutch') + 0.18 * scale(p.attrs.iq, 70, 99)),
  },
  {
    id: 'trash',
    title: 'Biggest Trash Talker',
    tagline: 'Will tell you your shoes are ugly while draining a three in your face.',
    icon: 'Megaphone',
    kind: 'vibes',
    fit: (p) => tag(p, 'trash'),
  },
  {
    id: 'ankles',
    title: 'Handles That Break Ankles',
    tagline: 'Defenders leave the game with a physical therapist.',
    icon: 'Wand',
    kind: 'vibes',
    fit: (p) => 0.6 * tag(p, 'ankles') + 0.4 * scale(p.attrs.hnd, 68, 99),
  },
  {
    id: 'hair',
    title: 'Best Hair (or Beard)',
    tagline: 'The follicles had a better career than most players.',
    icon: 'Scissors',
    kind: 'vibes',
    fit: (p) => tag(p, 'hair'),
  },
  {
    id: 'swag',
    title: 'Best Swag & Style',
    tagline: 'Tunnel fits. Sneaker deals. Pure aura.',
    icon: 'Shirt',
    kind: 'vibes',
    fit: (p) => tag(p, 'swag'),
  },
  {
    id: 'nickname',
    title: 'Best Nickname',
    tagline: 'If the nickname is on the jersey, it gets full marks.',
    icon: 'Tag',
    kind: 'vibes',
    fit: (p) => clamp100(0.85 * tag(p, 'nickn') + (p.nick ? 15 : 0)),
    fact: (p) => (p.nick ? `"${p.nick}"` : 'No nickname'),
  },
  {
    id: 'fast',
    title: 'Fastest With the Rock',
    tagline: 'Coast to coast before you finish blinking.',
    icon: 'Gauge',
    kind: 'vibes',
    fit: (p) => 0.6 * tag(p, 'fast') + 0.4 * scale(p.attrs.ath, 68, 99),
  },
  {
    id: 'jumper',
    title: 'Prettiest Jumper',
    tagline: 'Textbook form. Rainbow arc. Net barely moves.',
    icon: 'Target',
    kind: 'vibes',
    fit: (p) => 0.55 * tag(p, 'jumper') + 0.45 * scale(p.attrs.sht, 66, 99),
  },
  {
    id: 'hustle',
    title: 'Ultimate Glue Guy',
    tagline: 'Dives on the floor. Takes the charge. Does not need the shot.',
    icon: 'Handshake',
    kind: 'vibes',
    fit: (p) => tag(p, 'hustle'),
  },
  {
    id: 'flashy',
    title: 'Most Fun to Watch',
    tagline: 'You would pay full price just to see the warmups.',
    icon: 'Sparkles',
    kind: 'vibes',
    fit: (p) => tag(p, 'flashy'),
  },
  {
    id: 'smooth',
    title: 'Smoothest Player Ever',
    tagline: 'Looks like he is playing at 70% speed and still drops 30.',
    icon: 'Wind',
    kind: 'vibes',
    fit: (p) => tag(p, 'smooth'),
  },
  {
    id: 'bully',
    title: 'Pure Bully Ball',
    tagline: 'Gets to the rim by running through your entire family.',
    icon: 'Dumbbell',
    kind: 'vibes',
    fit: (p) => 0.7 * tag(p, 'bully') + 0.3 * scale(p.attrs.fin, 66, 99),
  },
  {
    id: 'underrated',
    title: 'Most Underrated Player Ever',
    tagline: 'Hall of Fame résumé, nobody talks about him enough.',
    icon: 'Gem',
    kind: 'vibes',
    fit: (p) => tag(p, 'underrated'),
  },
  {
    id: 'analyst',
    title: 'Best Studio Analyst After Retirement',
    tagline: 'Hot takes, loud laughs, and an inexplicable chemistry with the host.',
    icon: 'Mic',
    kind: 'vibes',
    fit: (p) => tag(p, 'analyst'),
  },
  {
    id: 'villain',
    title: 'Peak Villain Energy',
    tagline: 'Booed in every arena. Loved only at home.',
    icon: 'Skull',
    kind: 'vibes',
    fit: (p) => tag(p, 'villain'),
  },
  {
    id: 'funny',
    title: 'Funniest Teammate',
    tagline: 'Every locker room needs one. Postgame press is better with him.',
    icon: 'Laugh',
    kind: 'vibes',
    fit: (p) => tag(p, 'funny'),
  },
  {
    id: 'passer',
    title: 'Best Passer',
    tagline: 'Eyes in the back of his head. Dimes for days.',
    icon: 'Send',
    kind: 'stats',
    fit: (p) => scale(p.attrs.pas, 60, 99),
  },
  {
    id: 'shooter',
    title: 'Purest Shooter',
    tagline: 'If the shot is open, the shot is money.',
    icon: 'Crosshair',
    kind: 'stats',
    fit: (p) => scale(p.attrs.sht, 60, 99),
  },
  {
    id: 'rebounder',
    title: 'Glass Cleaner',
    tagline: 'If it comes off the rim, it belongs to him.',
    icon: 'Waves',
    kind: 'stats',
    fit: (p) => scale(p.attrs.reb, 60, 99),
  },
  {
    id: 'rim',
    title: 'Best Rim Protector',
    tagline: 'Please, do not even try to dunk on this man.',
    icon: 'Mountain',
    kind: 'stats',
    fit: (p) => scale(p.attrs.ind, 60, 99),
  },
  {
    id: 'lockdown',
    title: 'Perimeter Lockdown',
    tagline: 'Put him on the best scorer. Go get a snack.',
    icon: 'Shield',
    kind: 'stats',
    fit: (p) => scale(p.attrs.prd, 60, 99),
  },
  {
    id: 'athlete',
    title: 'Most Athletic Freak',
    tagline: 'A combine-breaking human being.',
    icon: 'Zap',
    kind: 'stats',
    fit: (p) => 0.75 * scale(p.attrs.ath, 60, 99) + 0.25 * tag(p, 'dunker'),
  },
  {
    id: 'twoway',
    title: 'Best Two-Way Player',
    tagline: 'Locks you up, then goes the other way and scores.',
    icon: 'Crown',
    kind: 'stats',
    fit: (p) => scale((p.off + p.def) / 2, 62, 90),
  },
  {
    id: 'bigpass',
    title: 'Best Passing Big Man',
    tagline: 'A center with a point guard brain (and the vision to match).',
    icon: 'Brain',
    kind: 'stats',
    fit: (p) => (p.ht >= 81 ? scale(p.attrs.pas, 50, 99) : scale(p.attrs.pas, 85, 99) * 0.25),
  },
  {
    id: 'bigshoot',
    title: 'Best Shooting Big Man',
    tagline: 'Pulls the center out to the three-point line and keeps going.',
    icon: 'Target',
    kind: 'stats',
    fit: (p) => (p.ht >= 81 ? scale(p.attrs.sht, 50, 99) : scale(p.attrs.sht, 90, 99) * 0.2),
  },
  {
    id: 'mvps',
    title: 'Most MVP Awards',
    tagline: 'Count the trophies on the shelf.',
    icon: 'Trophy',
    kind: 'stats',
    fit: (p) => clamp100((p.mvps / 6) * 100),
    fact: (p) => `${p.mvps} MVP${p.mvps === 1 ? '' : 's'}`,
  },
  {
    id: 'rings',
    title: 'Most Championship Rings',
    tagline: 'Who has the most jewelry?',
    icon: 'Medal',
    kind: 'stats',
    fit: (p) => clamp100((p.rings / 11) * 100),
    fact: (p) => `${p.rings} ring${p.rings === 1 ? '' : 's'}`,
  },
  {
    id: 'career',
    title: 'Longest Career',
    tagline: 'Played so long he got drafted by his own grandkid.',
    icon: 'Clock',
    kind: 'stats',
    fit: (p) => scale(p.to - p.from + 1, 6, 22),
    fact: (p) => `${p.to - p.from + 1} seasons`,
  },
  {
    id: 'best',
    title: 'Best Player, Period',
    tagline: 'No gimmicks. Who is simply the best?',
    icon: 'Star',
    kind: 'stats',
    fit: (p) => scale(p.ovr, 60, 99),
    fact: (p) => `${p.ovr} OVR`,
  },
]

export const PROMPT_BY_ID: Record<string, Prompt> = Object.fromEntries(PROMPTS.map((p) => [p.id, p]))

export type FitVerdict = 'perfect' | 'strong' | 'solid' | 'weak' | 'whiff'

export function verdictOf(fit: number): FitVerdict {
  if (fit >= 85) return 'perfect'
  if (fit >= 62) return 'strong'
  if (fit >= 38) return 'solid'
  if (fit >= 15) return 'weak'
  return 'whiff'
}

export const VERDICT_LINES: Record<FitVerdict, string[]> = {
  perfect: [
    'Perfect read. The ball knowledge is real.',
    'That is THE answer. Textbook.',
    'Hall of Fame brain. Nobody can argue with that.',
    'Absolutely nailed it. Pure basketball IQ.',
  ],
  strong: [
    'Strong take. Easy to defend at the barbershop.',
    'Great pick. Not quite the top answer, but close.',
    'Solid read. You clearly watch a lot of hoops.',
    'That is a respectable answer.',
  ],
  solid: [
    'A fair argument. The debate is alive.',
    'Defensible, but there were better answers.',
    'Not wrong. Not right. Mostly vibes.',
    'Okay, I see what you did there.',
  ],
  weak: [
    'Bold. Wrong, but bold.',
    'That is a stretch. A long stretch.',
    'Somebody needs to rewatch some film.',
    'Reaching a little there, chief.',
  ],
  whiff: [
    'Complete whiff. Were you even watching?',
    'The group chat is going to destroy you for this.',
    'Zero ball knowledge detected.',
    'That pick should come with an apology.',
  ],
}

export const VERDICT_LABEL: Record<FitVerdict, string> = {
  perfect: 'PERFECT READ',
  strong: 'STRONG TAKE',
  solid: 'FAIR POINT',
  weak: 'REACH',
  whiff: 'WHIFF',
}
