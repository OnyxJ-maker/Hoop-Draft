import { motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import { AppBar } from '@/components/AppBar'
import { Icon } from '@/components/Icon'
import { FORMATS, FORMAT_ORDER } from '@/engine/formats'
import { sfx } from '@/audio/sfx'
import { useGame } from '@/store/game'

export function FormatScreen() {
  const goto = useGame((s) => s.goto)
  const pickFormat = useGame((s) => s.pickFormat)
  return (
    <div className="min-h-screen">
      <AppBar title="Draft Night" onBack={() => goto('menu')} showQuit={false} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h1 className="font-display text-5xl uppercase leading-none text-white sm:text-6xl">Pick your draft</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Six ways to build a team. Every mode works solo against CPU GMs or with a room full of friends passing the device.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FORMAT_ORDER.map((id, i) => {
            const f = FORMATS[id]
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  sfx.select()
                  pickFormat(id)
                }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border p-5 text-left transition-shadow"
                style={{
                  borderColor: `${f.accent}55`,
                  background: `linear-gradient(160deg, ${f.accent}26, #14102b 55%)`,
                  boxShadow: `0 18px 50px -28px ${f.accent}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl" style={{ background: f.accent, color: '#120d1f' }}>
                    <Icon name={f.icon} className="size-6" strokeWidth={2.4} />
                  </span>
                  {f.themed && (
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-cond text-[11.5px] font-bold uppercase tracking-widest text-white/80">
                      Prompt rounds
                    </span>
                  )}
                </div>
                <h2 className="mt-4 font-display text-3xl uppercase leading-none text-white">{f.name}</h2>
                <div className="mt-1 font-cond text-[15px] font-bold uppercase tracking-wide" style={{ color: f.accent }}>
                  {f.tagline}
                </div>
                <p className="mt-3 text-[14.5px] leading-relaxed text-white/75">{f.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {f.rules.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[13.5px] text-white/70">
                      <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: f.accent }} />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between pt-1">
                  <span className="font-cond text-[13px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {f.defaultRounds} rounds default
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-cond text-[14px] font-bold uppercase tracking-wider transition-transform group-hover:translate-x-1"
                    style={{ background: f.accent, color: '#120d1f' }}
                  >
                    Play <ArrowRight className="size-4" />
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
