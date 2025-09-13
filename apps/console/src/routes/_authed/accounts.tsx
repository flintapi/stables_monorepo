import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute(`/_authed/accounts`)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      _authed/accounts
      <Button
        onClick={() => {
          console.log('Log out call')
          window.alert('Window alert on click')
        }}
      >
        Click Me
      </Button>
    </div>
  )
}
