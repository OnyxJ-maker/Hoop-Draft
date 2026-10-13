import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, LayoutGrid, List, Search, X } from 'lucide-react'
import { OvrBadge } from '@/components/bits'
import { PlayerCard } from '@/components/PlayerCard'
import { Input } from '@/components/ui/input'
import { getPlayer, normalizeText } from '@/data/players'
import type { OfferItem } from '@/engine/draft'
import { POSITIONS, heightLabel, type Player, type Pos } from '@/engine/types'
import { cn } from '@/lib/utils'

type SortKey = 'ovr' | 'name' | 'pos' | 'ht' | 'era' | 'sht' | 'fin' | 'hnd' | 'pas' | 'reb' | 'def' | 'ath' | 'price'

const POS_ORDER: Record<Pos, number> = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 }

const sortValue = (p: Player, k: SortKey): number | string => {
  switch (k) {
    case 'ovr':
      return p.ovr
    case 'name':
      return p.name
    case 'pos':
      return POS_ORDER[p.pos[0]]
    case 'ht':
      return p.ht
    case 'era':
      return p.from
    case 'sht':
      return p.attrs.sht
    case 'fin':
      return p.attrs.fin
    case 'hnd':
      return p.attrs.hnd
    case 'pas':
      return p.attrs.pas
    case 'reb':
      return p.attrs.reb
    case 'def':
      return Math.max(p.attrs.prd, p.attrs.ind)
    case 'ath':
      return p.attrs.ath
    case 'price':
      return p.price
  }
}

const tone = (v: number) => (v >= 92 ? 'text-lime-300' : v >= 80 ? 'text-white' : v >= 62 ? 'text-white/65' : 'text-white/35')

interface Props {
  items: OfferItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onConfirm: (id: string) => void
  showPrice?: boolean
  canAct: boolean
  banner?: ReactNode
}

export function OpenBoard({ items, selectedId, onSelect, onConfirm, showPrice, canAct, banner }: Props) {
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<Pos | null>(null)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'ovr', dir: -1 })
  const [view, setView] = useState<'table' | 'cards'>('table')

  const rows = useMemo(() => {
    const q = normalizeText(query.trim())
    const list = items
      .map((it) => ({ it, p: getPlayer(it.id) }))
      .filter(({ p }) => {
        if (pos && !p.pos.includes(pos)) return false
        if (q && !(normalizeText(p.name).includes(q) || normalizeText(p.nick).includes(q))) return false
        return true
      })
    list.sort((a, b) => {
      const va = sortValue(a.p, sort.key)
      const vb = sortValue(b.p, sort.key)
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      if (cmp !== 0) return cmp * sort.dir
      return b.p.ovr - a.p.ovr || a.p.name.localeCompare(b.p.name)
    })
    return list
  }, [items, query, pos, sort])

  const setSortKey = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === 'name' || key === 'pos' || key === 'era' ? 1 : -1 }))

  const cols: Array<{ key: SortKey; label: string; cls?: string }> = [
    { key: 'ovr', label: 'OVR' },
    { key: 'name', label: 'Player' },
    { key: 'pos', label: 'Pos' },
    { key: 'ht', label: 'Ht', cls: 'hidden md:table-cell' },
    { key: 'era', label: 'Era', cls: 'hidden xl:table-cell' },
    { key: 'sht', label: 'Sht', cls: 'hidden sm:table-cell' },
    { key: 'fin', label: 'Fin', cls: 'hidden sm:table-cell' },
    { key: 'hnd', label: 'Hnd', cls: 'hidden lg:table-cell' },
    { key: 'pas', label: 'Pas', cls: 'hidden lg:table-cell' },
    { key: 'reb', label: 'Reb', cls: 'hidden sm:table-cell' },
    { key: 'def', label: 'Def', cls: 'hidden sm:table-cell' },
    { key: 'ath', label: 'Ath', cls: 'hidden xl:table-cell' },
    ...(showPrice ? [{ key: 'price' as SortKey, label: '$M' }] : []),
  ]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players or nicknames…"
            aria-label="Search players"
            className="h-10 border-white/15 bg-white/5 pl-9 pr-8"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              onClick={() => setQuery('')}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1" role="group" aria-label="Filter by position">
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={pos === p}
              onClick={() => setPos(pos === p ? null : p)}
              className={cn(
                'h-10 w-11 rounded-lg border font-cond text-[14px] font-bold tracking-wider transition-colors',
                pos === p ? 'border-primary bg-primary text-primary-foreground' : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10',
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-lg border border-white/15" role="group" aria-label="View mode">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
            className={cn('grid h-10 w-10 place-items-center', view === 'table' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10')}
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Card view"
            aria-pressed={view === 'cards'}
            onClick={() => setView('cards')}
            className={cn('grid h-10 w-10 place-items-center', view === 'cards' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10')}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {banner}

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 scrollbar-thin">
        {rows.length === 0 ? (
          <div className="grid h-40 place-items-center text-muted-foreground">No players match your filters.</div>
        ) : view === 'table' ? (
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 z-10 bg-[#171334]">
              <tr>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn('border-b border-white/10 px-2 py-2 font-cond text-[12px] font-bold uppercase tracking-widest text-muted-foreground', c.cls)}
                  >
                    <button type="button" onClick={() => setSortKey(c.key)} className="inline-flex items-center gap-0.5 hover:text-white">
                      {c.label}
                      {sort.key === c.key && (sort.dir === -1 ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ it, p }) => {
                const selected = selectedId === p.id
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    onDoubleClick={() => it.ok && canAct && onConfirm(p.id)}
                    title={it.ok ? undefined : it.reason}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selected ? 'bg-primary/20' : 'hover:bg-white/[0.07]',
                      !it.ok && 'opacity-40',
                    )}
                  >
                    <td className={cn('border-b border-white/5 px-2 py-1.5', selected && 'border-l-4 border-l-primary')}>
                      <OvrBadge player={p} />
                    </td>
                    <td className="border-b border-white/5 px-2 py-1.5">
                      <div className="font-cond text-[16px] font-bold uppercase leading-tight text-white">{p.name}</div>
                      <div className="font-cond text-[11.5px] font-medium uppercase leading-tight tracking-wide text-white/45">
                        {p.nick ? `“${p.nick}” · ` : ''}
                        {p.archetype.label}
                      </div>
                    </td>
                    <td className="border-b border-white/5 px-2 py-1.5 font-cond text-[13px] font-bold uppercase tracking-wide text-white/75">{p.pos.join('/')}</td>
                    <td className="hidden border-b border-white/5 px-2 py-1.5 font-cond text-[13px] font-semibold text-white/60 md:table-cell">{heightLabel(p.ht)}</td>
                    <td className="hidden border-b border-white/5 px-2 py-1.5 font-cond text-[13px] font-semibold text-white/60 xl:table-cell">
                      {p.from}–{String(p.to).slice(-2)}
                    </td>
                    {(['sht', 'fin'] as const).map((k) => (
                      <td key={k} className={cn('hidden border-b border-white/5 px-2 py-1.5 font-display text-[15px] sm:table-cell', tone(p.attrs[k]))}>
                        {p.attrs[k]}
                      </td>
                    ))}
                    {(['hnd', 'pas'] as const).map((k) => (
                      <td key={k} className={cn('hidden border-b border-white/5 px-2 py-1.5 font-display text-[15px] lg:table-cell', tone(p.attrs[k]))}>
                        {p.attrs[k]}
                      </td>
                    ))}
                    <td className={cn('hidden border-b border-white/5 px-2 py-1.5 font-display text-[15px] sm:table-cell', tone(p.attrs.reb))}>{p.attrs.reb}</td>
                    <td className={cn('hidden border-b border-white/5 px-2 py-1.5 font-display text-[15px] sm:table-cell', tone(Math.max(p.attrs.prd, p.attrs.ind)))}>
                      {Math.max(p.attrs.prd, p.attrs.ind)}
                    </td>
                    <td className={cn('hidden border-b border-white/5 px-2 py-1.5 font-display text-[15px] xl:table-cell', tone(p.attrs.ath))}>{p.attrs.ath}</td>
                    {showPrice && <td className="border-b border-white/5 px-2 py-1.5 font-display text-[15px] text-violet-200">${p.price}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 p-3">
            {rows.slice(0, 48).map(({ it, p }) => (
              <PlayerCard
                key={p.id}
                player={p}
                size="sm"
                selected={selectedId === p.id}
                disabled={!it.ok}
                onClick={() => onSelect(p.id)}
                tag={showPrice ? <span className="rounded-full bg-violet-500 px-1.5 py-px font-display text-[11px] text-white">${p.price}M</span> : undefined}
              />
            ))}
            {rows.length > 48 && <div className="w-full pb-2 text-center text-sm text-muted-foreground">Showing top 48. Search or filter to narrow it down.</div>}
          </div>
        )}
      </div>
      <div className="pt-1.5 text-right font-cond text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
        {rows.length} of {items.length} available
      </div>
    </div>
  )
}
