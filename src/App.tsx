import { CourtBackdrop } from '@/components/bits'
import { lazy, Suspense } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useGame } from '@/store/game'
import { DraftScreen } from '@/screens/DraftScreen'
import { FormatScreen } from '@/screens/FormatScreen'
import { LotteryScreen } from '@/screens/LotteryScreen'
import { MenuScreen } from '@/screens/MenuScreen'
import { SetupScreen } from '@/screens/SetupScreen'

const RecapScreen = lazy(() => import('@/screens/RecapScreen').then((m) => ({ default: m.RecapScreen })))
const FinaleScreen = lazy(() => import('@/screens/FinaleScreen').then((m) => ({ default: m.FinaleScreen })))
const HallOfFameScreen = lazy(() => import('@/screens/HallOfFameScreen').then((m) => ({ default: m.HallOfFameScreen })))

function Screen() {
  const screen = useGame((s) => s.screen)
  switch (screen) {
    case 'menu':
      return <MenuScreen />
    case 'formats':
      return <FormatScreen />
    case 'setup':
      return <SetupScreen />
    case 'lottery':
      return <LotteryScreen />
    case 'draft':
      return <DraftScreen />
    case 'recap':
      return <RecapScreen />
    case 'finale':
      return <FinaleScreen />
    case 'hof':
      return <HallOfFameScreen />
    default:
      return <MenuScreen />
  }
}

export default function App() {
  const screen = useGame((s) => s.screen)
  return (
    <TooltipProvider delayDuration={150}>
      <CourtBackdrop />
      <div key={screen} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Suspense fallback={<div className="grid min-h-screen place-items-center font-display text-3xl uppercase text-white/60">Loading…</div>}>
          <Screen />
        </Suspense>
      </div>
    </TooltipProvider>
  )
}
