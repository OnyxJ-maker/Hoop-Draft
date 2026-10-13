import { useState, type ReactNode } from 'react'
import { ArrowLeft, Home, Volume2, VolumeX, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { sfx } from '@/audio/sfx'
import { useGame } from '@/store/game'
import { useSettings } from '@/store/settings'
import { Logo } from './bits'

export function SoundToggle() {
  const sound = useSettings((s) => s.sound)
  const toggle = useSettings((s) => s.toggleSound)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={sound ? 'Mute sound' : 'Unmute sound'}
          onClick={() => {
            toggle()
            if (!sound) setTimeout(() => sfx.select(), 30)
          }}
          className="text-white/80 hover:text-white"
        >
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{sound ? 'Sound on' : 'Sound off'}</TooltipContent>
    </Tooltip>
  )
}

export function FastToggle() {
  const fast = useSettings((s) => s.fast)
  const toggle = useSettings((s) => s.toggleFast)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={fast ? 'default' : 'ghost'}
          size="icon"
          aria-label="Quick CPU picks"
          aria-pressed={fast}
          onClick={toggle}
          className={fast ? '' : 'text-white/80 hover:text-white'}
        >
          <Zap className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{fast ? 'Quick mode on: CPU picks fly by' : 'Quick mode off'}</TooltipContent>
    </Tooltip>
  )
}

export function QuitButton({ label = 'Menu' }: { label?: string }) {
  const [open, setOpen] = useState(false)
  const goto = useGame((s) => s.goto)
  const endGame = useGame((s) => s.endGame)
  const hasGame = useGame((s) => !!s.draft)
  return (
    <>
      <Button
        variant="ghost"
        className="gap-2 text-white/80 hover:text-white"
        onClick={() => (hasGame ? setOpen(true) : goto('menu'))}
        aria-label="Back to menu"
      >
        <Home className="size-4" />
        <span className="hidden font-cond text-[14px] font-bold uppercase tracking-wider sm:inline">{label}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/15 bg-[#12102a] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase">Leave this game?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You can pause and resume this draft from the main menu, or scrap it and start fresh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-white/20 bg-transparent">
              Keep playing
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false)
                goto('menu')
              }}
            >
              Pause to menu
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setOpen(false)
                endGame()
              }}
            >
              Scrap game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AppBar({
  title,
  onBack,
  right,
  showQuit = true,
  children,
}: {
  title?: ReactNode
  onBack?: () => void
  right?: ReactNode
  showQuit?: boolean
  children?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0b1d]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-2 px-3 sm:px-5">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="text-white/80 hover:text-white">
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <Logo size="sm" className="mr-2 hidden sm:flex" />
        {title && <div className="min-w-0 flex-1 truncate font-display text-xl uppercase tracking-wide text-white sm:text-2xl">{title}</div>}
        {!title && <div className="flex-1" />}
        {children}
        {right}
        <SoundToggle />
        {showQuit && <QuitButton />}
      </div>
    </header>
  )
}
