import { createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { env } from '@/env'
import { Loader } from '@/components/ui/loader'

export const Route = createFileRoute('/invite/$inviteId')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = Route.useParams()
  const router = useRouter()

  const { data: _invitation, error: _ } = useQuery({
    queryKey: ['invitation', 'get', 'validate'],
    queryFn: async () => {
      const { data, error } = await authClient.organization.getInvitation({
        query: {
          id: params.inviteId
        }
      })

      if (error) {
        console.log('Error accepting invitation:', { error })
        toast.error(`Your invitation might be invalid or has expired, ask inviter to resend`, {
          description: error?.message
        })
      }
      console.log('Invitation accepted successfully', data)
      if (data) {
        toast.success(`Invitation confirmed and valid`, {
          description: (
            <div>
              <span>
                Your invitation has been confirmed to accept, sign in with your prefered social account that matches the email address the invite was sent to.
                Navigate to the teams tab and accept the invite
              </span>
            </div>
          ),
          action: {
            label: 'Continue',
            onClick: (_event) => {
              router.navigate({
                to: '/auth',
                replace: true,
                resetScroll: true,
                search: { redirect: `${env.VITE_APP_URL}/settings` },
              })
            }
          }
        })
      }
    }
  })
  return (
    <div className='@container p-4 mt-4 gap-2 flex items-center justify-center'>
      <Loader /><span>Processing invite...</span>
    </div>
  )
}
