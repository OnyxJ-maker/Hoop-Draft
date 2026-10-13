import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SegOption<T> {
  value: T
  label: ReactNode
  hint?: string
  disabled?: boolean
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: SegOption<T>[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="radiogroup" className={cn('inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/25 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg px-3 font-cond font-bold uppercase tracking-wider transition-all',
              size === 'md' ? 'py-1.5 text-[14px]' : 'py-1 text-[12.5px]',
              active
                ? 'bg-primary text-primary-foreground shadow-[0_0_18px_-4px_var(--primary)]'
                : 'text-muted-foreground hover:bg-white/10 hover:text-white',
              o.disabled && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-muted-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Panel({
  title,
  icon,
  children,
  className,
  right,
}: {
  title?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
  right?: ReactNode
}) {
  return (
    <section className={cn('glass rounded-2xl p-4 sm:p-5', className)}>
      {title && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl uppercase tracking-wide text-white">
            {icon}
            {title}
          </h2>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="font-cond text-[13px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
