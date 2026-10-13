import { CourtBackdrop } from '@/components/bits'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useGame } from '@/store/game'
import { DraftScreen } from '@/screens/DraftScreen'
import { FormatScreen } from '@/screens/FormatScreen'
import { LotteryScreen } from '@/screens/LotteryScreen'
import { MenuScreen } from '@/screens/MenuScreen'
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
