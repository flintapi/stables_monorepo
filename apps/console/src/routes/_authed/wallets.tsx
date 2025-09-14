import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute(`/_authed/wallets`)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="animate-fade-down">
      _authed/accounts
      <Button
        onClick={() => {
          console.log('Log out call')
        }}
      >
        Click Me
      </Button>
    </div>
  )
}
