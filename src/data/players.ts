import {
  ATTR_KEYS,
  TAG_KEYS,
  type Archetype,
  type AttrKey,
  type Attrs,
  type Player,
  type Pos,
  type TagKey,
  type TierKey,
} from '@/engine/types'
import { RAW_PLAYERS } from './rawPlayers'
import { TAG_EXTRA, TAG_LISTS } from './tags'

const DISPLAY_NAMES: Record<string, string> = {
  'Nikola Jokic': 'Nikola Jokić',
  'Luka Doncic': 'Luka Dončić',
  'Kristaps Porzingis': 'Kristaps Porziņģis',
  'Manu Ginobili': 'Manu Ginóbili',
  'Drazen Petrovic': 'Dražen Petrović',
  'Peja Stojakovic': 'Peja Stojaković',
  'Toni Kukoc': 'Toni Kukoč',
  'Alperen Sengun': 'Alperen Şengün',
  'Nikola Vucevic': 'Nikola Vučević',
  'Gheorghe Muresan': 'Gheorghe Mureșan',
  'Arvydas Sabonis': 'Arvydas Sabonis',
  'Vlade Divac': 'Vlade Divac',
}

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function tierOf(ovr: number): TierKey {
  if (ovr >= 97) return 'galaxy'
  if (ovr >= 93) return 'amethyst'
  if (ovr >= 87) return 'diamond'
  if (ovr >= 80) return 'gold'
  if (ovr >= 72) return 'silver'
  return 'bronze'
}

export const TIER_LABEL: Record<TierKey, string> = {
  bronze: 'Role Player',
  silver: 'Rotation',
  gold: 'Starter',
  diamond: 'All-Star',
  amethyst: 'Superstar',
  galaxy: 'GOAT Tier',
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function offenseOf(a: Attrs): number {
  const scoring = Math.max(a.fin, a.sht) * 0.65 + Math.min(a.fin, a.sht) * 0.35
  const creation = a.hnd * 0.5 + a.pas * 0.5
  return Math.round(scoring * 0.65 + creation * 0.35)
}

function defenseOf(a: Attrs): number {
  const best = Math.max(a.prd, a.ind)
  const other = Math.min(a.prd, a.ind)
  return Math.round(best * 0.62 + other * 0.18 + a.iq * 0.1 + a.ath * 0.1)
}

export function archetypeOf(p: Pick<Player, 'attrs' | 'ht' | 'ovr' | 'pos' | 'off' | 'def'>): Archetype {
  const a = p.attrs
  const big = p.ht >= 82
  if (a.ind >= 90 && big && a.fin < 88) return { key: 'rim', label: 'Rim Protector', icon: 'Mountain' }
  if (a.reb >= 96 && a.fin < 88) return { key: 'glass', label: 'Glass Cleaner', icon: 'Anchor' }
  if (a.pas >= 90 && big) return { key: 'pcenter', label: 'Point Center', icon: 'Brain' }
  if (a.pas >= 90 && p.ht >= 80) return { key: 'pforward', label: 'Point Forward', icon: 'Brain' }
  if (a.pas >= 93) return { key: 'general', label: 'Floor General', icon: 'Brain' }
  if (a.sht >= 94 && a.hnd >= 90) return { key: 'sniper', label: 'Shot Creator', icon: 'Crosshair' }
  if (a.sht >= 92) return { key: 'shooter', label: 'Sharpshooter', icon: 'Target' }
  if (a.prd >= 94 && p.ovr < 94) return { key: 'lockdown', label: 'Lockdown Defender', icon: 'Shield' }
  if (a.ath >= 94 && a.fin >= 86) return { key: 'slasher', label: 'High-Flying Slasher', icon: 'Rocket' }
  if (a.fin >= 92 && big) return { key: 'paint', label: 'Paint Dominator', icon: 'Hammer' }
  if (a.hnd >= 92) return { key: 'wizard', label: 'Ball Wizard', icon: 'Wand' }
  if (p.ovr >= 93 && Math.max(a.prd, a.ind) >= 80) return { key: 'twoway', label: 'Two-Way Superstar', icon: 'Crown' }
  if (p.ovr >= 90) return { key: 'scorer', label: 'Bucket Getter', icon: 'Flame' }
  if (big && a.sht >= 76) return { key: 'stretch', label: 'Stretch Big', icon: 'Zap' }
  if (big) return { key: 'big', label: 'Interior Big', icon: 'Mountain' }
  if (a.prd >= 86) return { key: 'wing', label: '3-and-D Wing', icon: 'Shield' }
  if (a.sht >= 84) return { key: 'spacer', label: 'Floor Spacer', icon: 'Target' }
  if (p.off >= p.def + 10) return { key: 'bucket', label: 'Scoring Guard', icon: 'Flame' }
  return { key: 'glue', label: 'Glue Guy', icon: 'Sparkles' }
}

function priceOf(ovr: number, off: number, def: number): number {
  const base = 2 + 38 * Math.pow(clamp((ovr - 58) / 41, 0, 1), 2.4)
  const tweak = clamp(Math.round((off - def) / 16), -2, 2)
  return clamp(Math.round(base + tweak), 2, 42)
}

function decadesOf(from: number, to: number): number[] {
  const span = to - from
  const primeStart = span < 5 ? from : from + 2
  const primeEnd = span < 5 ? to : Math.min(to, from + 11)
  const counts = new Map<number, number>()
  for (let y = primeStart; y <= primeEnd; y++) {
    const d = Math.floor(y / 10) * 10
    counts.set(d, (counts.get(d) ?? 0) + 1)
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const result = best.filter(([, c]) => c >= 4).map(([d]) => d)
  if (result.length === 0 && best.length > 0) result.push(best[0][0])
  return result.sort((a, b) => a - b)
}

function parseLine(line: string): Player {
  const parts = line.split('|')
  if (parts.length !== 9) throw new Error(`Bad player line (${parts.length} fields): ${line}`)
  const [name, posRaw, htRaw, ovrRaw, spanRaw, attrRaw, nick, ringsRaw, mvpsRaw] = parts
  const pos = posRaw.split('/') as Pos[]
  const [fromRaw, toRaw] = spanRaw.split('-')
  const nums = attrRaw.trim().split(/\s+/).map(Number)
  if (nums.length !== ATTR_KEYS.length) throw new Error(`Bad attrs for ${name}`)
  const attrs = {} as Attrs
  ATTR_KEYS.forEach((k: AttrKey, i) => {
    attrs[k] = nums[i]
  })
  const ovr = Number(ovrRaw)
  const from = Number(fromRaw)
  const to = Number(toRaw)
  const off = offenseOf(attrs)
  const def = defenseOf(attrs)
  const base = {
    id: slugify(name),
    name: DISPLAY_NAMES[name] ?? name,
    nick: nick.trim(),
    pos,
    ht: Number(htRaw),
    ovr,
    from,
    to,
    attrs,
    rings: Number(ringsRaw),
    mvps: Number(mvpsRaw),
    tags: {} as Partial<Record<TagKey, number>>,
    tier: tierOf(ovr),
    decades: decadesOf(from, to),
    active: to >= 2025,
    price: priceOf(ovr, off, def),
    off,
    def,
  }
  return { ...base, archetype: archetypeOf(base) }
}

export const PLAYERS: Player[] = RAW_PLAYERS.trim()
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map(parseLine)

export const PLAYER_BY_ID: Record<string, Player> = Object.fromEntries(PLAYERS.map((p) => [p.id, p]))

const RAW_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  RAW_PLAYERS.trim()
    .split('\n')
    .map((l) => l.split('|')[0].trim())
    .filter(Boolean)
    .map((n) => [n, slugify(n)]),
)

export const MISSING_TAG_NAMES: string[] = []

for (const key of TAG_KEYS) {
  for (const levels of [TAG_LISTS[key], TAG_EXTRA[key] ?? {}]) {
    for (const lvl of [1, 2, 3] as const) {
      for (const name of levels[lvl] ?? []) {
        const id = RAW_NAME_TO_ID[name]
        const player = id ? PLAYER_BY_ID[id] : undefined
        if (!player) {
          MISSING_TAG_NAMES.push(`${key}:${name}`)
          continue
        }
        player.tags[key] = Math.max(player.tags[key] ?? 0, lvl)
      }
    }
  }
}

for (const p of PLAYERS) {
  if (p.nick && !p.tags.nickn) p.tags.nickn = 2
}

export function getPlayer(id: string): Player {
  const p = PLAYER_BY_ID[id]
  if (!p) throw new Error(`Unknown player id: ${id}`)
  return p
}

export function playersOf(ids: string[]): Player[] {
  return ids.map(getPlayer)
}
