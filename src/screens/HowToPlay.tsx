import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FORMATS, FORMAT_ORDER } from '@/engine/formats'
import { Icon } from '@/components/Icon'

export function HowToPlay({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-white/15 bg-[#12102a] text-white">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase tracking-wide">How to play</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pass-and-play with as many friends as you want, or go solo against CPU GMs. One screen, no accounts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-[15px] leading-relaxed text-white/85">
          <section>
            <h3 className="mb-1 font-display text-xl uppercase text-primary">82-0 Mode</h3>
            <p>
              Draft a super team, then watch your squad play a full 82-game season. Your goal is a perfect record. The Perfect Season Odds meter
              updates as you draft, so build a roster with <b>no flaws</b>: you need spacing, a ball handler, rim protection and elite talent.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-display text-xl uppercase text-primary">Draft Night</h3>
            <p className="mb-3">Pick a format. Everybody drafts, then the league plays it out and crowns a champion.</p>
            <ul className="space-y-2.5">
              {FORMAT_ORDER.map((id) => {
                const f = FORMATS[id]
                return (
                  <li key={id} className="flex gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `${f.accent}33`, color: f.accent }}>
                      <Icon name={f.icon} className="size-4" />
                    </span>
                    <span>
                      <b className="text-white">{f.name}.</b> {f.description}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
          <section>
            <h3 className="mb-1 font-display text-xl uppercase text-primary">Building a real team</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Team rating is driven by talent, but chemistry matters. Stack five centers and you will pay for it.</li>
              <li>Every card shows its tier: bronze, silver, gold, diamond, amethyst and GOAT holo.</li>
              <li>Before you draft someone, the scouting panel shows exactly how the pick changes your team.</li>
              <li>Hot-seat multiplayer: when it is your pick, the screen says so. Pass the device around.</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
