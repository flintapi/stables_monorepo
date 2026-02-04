import { createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { env } from '@/env'
import { Loader } from '@/components/ui/loader'
import { List, ListItem } from '@/components/ui/list'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { acceptUserInvitationMutationOptions } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/invite/$inviteId')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = Route.useParams()
  const router = useRouter()

  const { data: _invitation, error: _, isLoading } = useQuery({
    queryKey: ['invitation', 'get', 'validate'],
    queryFn: async () => {
      const { data, error } = await authClient.organization.getInvitation({
        query: {
          id: params.inviteId
        }
      })

      if (error) {
        console.log('Error accepting invitation:', { error })

        if (error?.code === "NOT_AUTHENTICATED") {
          router.navigate({
            to: '/auth',
            replace: true,
            resetScroll: true,
            search: { redirect: `${env.VITE_APP_URL}/invite/${params.inviteId}` },
          })
        } else {
          toast.error(`Something went wrong with invite.`, {
            description: error?.message
          })
        }
      }

      return data;
    }
  })
  const { mutateAsync: acceptInviteMutateAsync, isPending: acceptingInvite } = useMutation(acceptUserInvitationMutationOptions)

  return (
    <div className='@container w-full p-4 mt-8 gap-2 flex items-center justify-center'>
      {
        isLoading && <div>
          <Loader /><span>Processing invite...</span>
        </div>
      }

      {
        !isLoading && <List className='max-w-2xl'>
          <h1 className={cn(`font-semibold text-xl wrap-normal text-balance text-center`)}>Click the accept invite button to<br/> join the {_invitation?.organizationName} org.</h1>
          <ListItem
            title={_invitation?.email || ""}
            description={_invitation?.status}
            borderLast
            suffix={
              <div className='flex items-center justify-between'>
                <Button
                  size="sm"
                  variant="outline"
                  className='rounded-2xl'
                  onClick={async () => {
                    if (_invitation?.id) {
                      await acceptInviteMutateAsync({ invitationId: _invitation?.id })
                        .then((_value) =>
                          router.navigate({
                            to: '/overview',
                            replace: true,
                            resetScroll: true,
                            // search: { redirect: null },
                          })
                        )
                    }
                  }}
                >{acceptingInvite ? <Loader /> : 'Accept invite'}</Button>
              </div>
            }
            prefix={
              <Avatar>
                <AvatarImage src={undefined as string | undefined} />
                <AvatarFallback>
                  {_invitation?.email.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            }
          />
        </List>
      }

    </div>
  )
}
