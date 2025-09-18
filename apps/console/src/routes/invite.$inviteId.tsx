import { createFileRoute, redirect } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/invite/$inviteId')({
  loader: async ({ params }) => {
    const inviteId = params.inviteId
    const { data, error } = await authClient.organization.acceptInvitation({
      invitationId: inviteId,
    })

    if (error) {
      console.log('Error accepting invitation:', error)
      throw redirect({ to: '/auth' })
    }
    console.log('Invitation accepted successfully', data)
    throw redirect({ to: '/auth' })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Processing invite</div>
}
