import { shuffle, type Rng } from '@/engine/rng'

export interface Franchise {
  id: string
  city: string
  mascot: string
  color: string
  icon: string
}

export const FRANCHISES: Franchise[] = [
  { id: 'bro', city: 'Brooklyn', mascot: 'Bodegas', color: '#f97316', icon: 'Store' },
  { id: 'aus', city: 'Austin', mascot: 'Armadillos', color: '#84cc16', icon: 'Shield' },
  { id: 'sea', city: 'Seattle', mascot: 'Squalls', color: '#06b6d4', icon: 'CloudLightning' },
  { id: 'den', city: 'Denver', mascot: 'Altitude', color: '#3b82f6', icon: 'Mountain' },
  { id: 'phx', city: 'Phoenix', mascot: 'Fireflies', color: '#ef4444', icon: 'Flame' },
  { id: 'mia', city: 'Miami', mascot: 'Manatees', color: '#14b8a6', icon: 'Fish' },
  { id: 'chi', city: 'Chicago', mascot: 'Gusts', color: '#60a5fa', icon: 'Wind' },
  { id: 'det', city: 'Detroit', mascot: 'Gearheads', color: '#94a3b8', icon: 'Cog' },
  { id: 'bos', city: 'Boston', mascot: 'Brew Crew', color: '#16a34a', icon: 'Beer' },
  { id: 'hou', city: 'Houston', mascot: 'Hot Sauce', color: '#dc2626', icon: 'Flame' },
  { id: 'atl', city: 'Atlanta', mascot: 'Peaches', color: '#fb7185', icon: 'Cherry' },
  { id: 'por', city: 'Portland', mascot: 'Pinecones', color: '#15803d', icon: 'TreePine' },
  { id: 'cle', city: 'Cleveland', mascot: 'Rockers', color: '#a855f7', icon: 'Guitar' },
  { id: 'phi', city: 'Philly', mascot: 'Cheesesteaks', color: '#eab308', icon: 'Sandwich' },
  { id: 'mem', city: 'Memphis', mascot: 'Pitmasters', color: '#b45309', icon: 'Utensils' },
  { id: 'dal', city: 'Dallas', mascot: 'Wranglers', color: '#1d4ed8', icon: 'Star' },
  { id: 'slc', city: 'Salt Lake', mascot: 'Yetis', color: '#38bdf8', icon: 'Snowflake' },
  { id: 'nol', city: 'New Orleans', mascot: 'Gators', color: '#22c55e', icon: 'Bug' },
  { id: 'lal', city: 'Los Angeles', mascot: 'Lightning', color: '#fbbf24', icon: 'Zap' },
  { id: 'sac', city: 'Sacramento', mascot: 'Sunrise', color: '#f59e0b', icon: 'Sun' },
  { id: 'min', city: 'Minneapolis', mascot: 'Frost', color: '#0ea5e9', icon: 'Snowflake' },
  { id: 'mil', city: 'Milwaukee', mascot: 'Brewmasters', color: '#ca8a04', icon: 'Wheat' },
  { id: 'ind', city: 'Indianapolis', mascot: 'Racers', color: '#e11d48', icon: 'Gauge' },
  { id: 'cha', city: 'Charlotte', mascot: 'Stingers', color: '#7c3aed', icon: 'Bug' },
  { id: 'orl', city: 'Orlando', mascot: 'Wizards', color: '#6366f1', icon: 'Wand' },
  { id: 'was', city: 'Washington', mascot: 'Monuments', color: '#be123c', icon: 'Landmark' },
  { id: 'nyc', city: 'New York', mascot: 'Skyline', color: '#f43f5e', icon: 'Building2' },
  { id: 'tor', city: 'Toronto', mascot: 'Tundra', color: '#dc2626', icon: 'Snowflake' },
  { id: 'van', city: 'Vancouver', mascot: 'Orcas', color: '#0891b2', icon: 'Fish' },
  { id: 'hon', city: 'Honolulu', mascot: 'Riptide', color: '#06b6d4', icon: 'Waves' },
  { id: 'lvg', city: 'Las Vegas', mascot: 'High Rollers', color: '#facc15', icon: 'Dices' },
  { id: 'nas', city: 'Nashville', mascot: 'Honky Tonks', color: '#d946ef', icon: 'Music' },
  { id: 'kc', city: 'Kansas City', mascot: 'Smokehouse', color: '#c2410c', icon: 'Flame' },
  { id: 'pit', city: 'Pittsburgh', mascot: 'Forge', color: '#f5b301', icon: 'Hammer' },
  { id: 'bal', city: 'Baltimore', mascot: 'Crabcakes', color: '#ea580c', icon: 'Anchor' },
  { id: 'stl', city: 'St. Louis', mascot: 'Archers', color: '#2563eb', icon: 'Target' },
  { id: 'abq', city: 'Albuquerque', mascot: 'Aliens', color: '#65a30d', icon: 'Rocket' },
  { id: 'tpa', city: 'Tampa', mascot: 'Typhoon', color: '#0284c7', icon: 'Tornado' },
  { id: 'cin', city: 'Cincinnati', mascot: 'Chili Kings', color: '#b91c1c', icon: 'Crown' },
  { id: 'sd', city: 'San Diego', mascot: 'Surfers', color: '#2dd4bf', icon: 'Waves' },
]

export function franchiseName(f: Franchise): string {
  return `${f.city} ${f.mascot}`
}

export const TEAM_COLORS = [
  '#ff7a1a',
  '#22d3ee',
  '#f43f9d',
  '#a3e635',
  '#fbbf24',
  '#8b5cf6',
  '#ef4444',
  '#2dd4bf',
  '#60a5fa',
  '#fb923c',
  '#e879f9',
  '#4ade80',
  '#f472b6',
  '#38bdf8',
  '#facc15',
  '#c084fc',
]

export const TEAM_ICONS = [
  'Flame',
  'Zap',
  'Rocket',
  'Crown',
  'Bird',
  'Fish',
  'Dog',
  'Cat',
  'Bug',
  'Skull',
  'Ghost',
  'Anchor',
  'Snowflake',
  'Sun',
  'Moon',
  'Star',
  'Mountain',
  'TreePine',
  'Waves',
  'Swords',
  'Shield',
  'Gem',
  'Bomb',
  'Atom',
  'Hammer',
  'Cherry',
  'Pizza',
  'Coffee',
  'Trophy',
  'Target',
  'Diamond',
  'Rabbit',
]

export type GmStyle = 'balanced' | 'bigs' | 'guards' | 'defense' | 'shooters' | 'oldschool' | 'modern' | 'flash'

export interface GmPersona {
  name: string
  style: GmStyle
  blurb: string
}

export const GM_PERSONAS: GmPersona[] = [
  { name: 'Coach Beardsley', style: 'balanced', blurb: 'Takes the best player available, every time.' },
  { name: 'Big Mike', style: 'bigs', blurb: 'Believes you cannot teach size. Drafts centers by instinct.' },
  { name: 'Dre "Dimes" Dawson', style: 'guards', blurb: 'If it does not have a handle, he is not interested.' },
  { name: 'Grandpa Hal', style: 'oldschool', blurb: 'Basketball peaked in 1986. Do not argue with him.' },
  { name: 'Analytics Annie', style: 'shooters', blurb: 'Threes, layups, and free throws. Nothing else matters.' },
  { name: 'Lockdown Lou', style: 'defense', blurb: 'Defense wins championships. Offense is optional.' },
  { name: 'Hype Man Hector', style: 'flash', blurb: 'Drafts for highlight reels and Instagram clips.' },
  { name: 'Rookie Rae', style: 'modern', blurb: 'Only drafts guys she has seen on a phone screen.' },
  { name: 'Sleepy Pete', style: 'balanced', blurb: 'Dozes through rounds, wakes up with a steal.' },
  { name: 'The Professor', style: 'balanced', blurb: 'Has a spreadsheet for everything. Mostly right.' },
  { name: 'Coach K-Mart', style: 'defense', blurb: 'Blue-light special: loves a cheap, gritty defender.' },
  { name: 'Slick Rick', style: 'flash', blurb: 'Plays to the crowd, always.' },
  { name: 'Trader Jo', style: 'guards', blurb: 'Always looking to swap guards for guards.' },
  { name: 'Old Head Ollie', style: 'oldschool', blurb: 'Still mad about the three-point line.' },
  { name: 'Splash Sasha', style: 'shooters', blurb: 'Counts bricks like rosary beads.' },
  { name: 'Tower Terry', style: 'bigs', blurb: 'Has never met a seven-footer he did not like.' },
]

export function pickFranchises(rng: Rng, count: number, exclude: string[] = []): Franchise[] {
  const pool = FRANCHISES.filter((f) => !exclude.includes(f.id))
  return shuffle(rng, pool).slice(0, count)
}
