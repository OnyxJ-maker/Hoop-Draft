import { LayoutGrid } from 'lucide-react'
import { DraftBoardMatrix } from '@/components/DraftBoardMatrix'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { DraftState } from '@/engine/draft'

export function BoardDialog({ draft }: { draft: DraftState }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2 text-white/80 hover:text-white" aria-label="Open draft board">
          <LayoutGrid className="size-4" />
          <span className="hidden font-cond text-[14px] font-bold uppercase tracking-wider md:inline">Board</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/15 bg-[#12102a] text-white sm:max-w-[min(1200px,95vw)]">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">The draft board</DialogTitle>
          <DialogDescription className="text-muted-foreground">Every pick so far, round by round.</DialogDescription>
        </DialogHeader>
        <DraftBoardMatrix draft={draft} />
      </DialogContent>
    </Dialog>
  )
}
