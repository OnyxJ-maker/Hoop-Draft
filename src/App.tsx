import { CourtBackdrop } from '@/components/bits'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useGame } from '@/store/game'
import { DraftScreen } from '@/screens/DraftScreen'
import { FinaleScreen } from '@/screens/FinaleScreen'
import { FormatScreen } from '@/screens/FormatScreen'
import { HallOfFameScreen } from '@/screens/HallOfFameScreen'
import { LotteryScreen } from '@/screens/LotteryScreen'
import { MenuScreen } from '@/screens/MenuScreen'
import { RecapScreen } from '@/screens/RecapScreen'
import { SetupScreen } from '@/screens/SetupScreen'

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
        <Screen />
      </div>
    </TooltipProvider>
  )
}
