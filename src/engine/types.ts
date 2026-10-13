export type Pos = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
export const POSITIONS: Pos[] = ['PG', 'SG', 'SF', 'PF', 'C']

export type AttrKey = 'fin' | 'sht' | 'hnd' | 'pas' | 'reb' | 'prd' | 'ind' | 'ath' | 'iq'
export const ATTR_KEYS: AttrKey[] = ['fin', 'sht', 'hnd', 'pas', 'reb', 'prd', 'ind', 'ath', 'iq']
export type Attrs = Record<AttrKey, number>

export const ATTR_LABELS: Record<AttrKey, string> = {
  fin: 'Finishing',
  sht: 'Shooting',
  hnd: 'Handles',
  pas: 'Passing',
  reb: 'Rebounding',
  prd: 'Perimeter D',
  ind: 'Rim Protection',
  ath: 'Athleticism',
  iq: 'Hoop IQ',
}

export const ATTR_SHORT: Record<AttrKey, string> = {
  fin: 'FIN',
  sht: 'SHT',
  hnd: 'HND',
  pas: 'PAS',
  reb: 'REB',
  prd: 'PER',
  ind: 'RIM',
  ath: 'ATH',
  iq: 'IQ',
}

export const TAG_KEYS = [
  'cartoon',
  'predator',
  'unguardable',
  'tough',
  'dunker',
  'clutch',
  'trash',
  'ankles',
  'hair',
  'swag',
  'nickn',
  'fast',
  'jumper',
  'hustle',
  'flashy',
  'smooth',
  'bully',
  'underrated',
  'analyst',
  'villain',
  'funny',
] as const
export type TagKey = (typeof TAG_KEYS)[number]

export type TierKey = 'bronze' | 'silver' | 'gold' | 'diamond' | 'amethyst' | 'galaxy'

export interface Archetype {
  key: string
  label: string
  icon: string
}

export interface Player {
  id: string
  name: string
  nick: string
  pos: Pos[]
  ht: number
  ovr: number
  from: number
  to: number
  attrs: Attrs
  rings: number
  mvps: number
  tags: Partial<Record<TagKey, number>>
  tier: TierKey
  decades: number[]
  active: boolean
  price: number
  archetype: Archetype
  off: number
  def: number
}

export function heightLabel(inches: number): string {
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}
