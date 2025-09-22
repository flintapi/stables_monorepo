import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import NiceModal from '@ebay/nice-modal-react'
import z from 'zod'
import { ChevronsUpDown, Copy, PlusCircle, Trash2 } from 'lucide-react'
import { IconGlobe } from '@tabler/icons-react'
import { toast } from 'sonner'
import TeamInviteModal from './-components/modals/TeamInvite'
import { showDeleteOrgModal } from './-components/modals/DeleteOrganization'
import type { FC } from 'react'
import { Container, Main, Section } from '@/components/craft'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { List, ListItem } from '@/components/ui/list'
import { useConsoleForm } from '@/hooks/console.form'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { FatInput } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  getInvitationQueryOptions,
  getOrganizationsQueryOptions,
  getTeamQueryOptions,
} from '@/lib/api-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute(`/_authed/settings`)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Main>
      <Section className="animate-fade-down">
        <Container className="">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="api-keys">
                API Keys <Badge>1</Badge>
              </TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="md:max-w-3xl">
              <DetailsTab />
            </TabsContent>
            <TabsContent value="api-keys" className="md:max-w-3xl">
              <APIKeyTab />
            </TabsContent>
            <TabsContent value="team" className="md:max-w-3xl">
              <TeamTab />
            </TabsContent>
            <TabsContent value="notifications" className="md:max-w-3xl">
              <NotificationTab />
            </TabsContent>
          </Tabs>
        </Container>
      </Section>
    </Main>
  )
}

const DetailsTab: FC = () => {
  const queryClient = useQueryClient()
  const { data: activeOrg, error } = authClient.useActiveOrganization()

  if (error) {
    toast.error('Failed to fetch organization details')
  }

  const orgForm = useConsoleForm({
    defaultValues: {
      organizationName: activeOrg?.name || '',
    },
    validators: {
      onChange: z.object({
        organizationName: z.string().min(4).max(124),
      }),
    },
    onSubmit: async ({ value }) => {
      console.log('Update org value', value)

      if (activeOrg) {
        const { error: orgUpdateError } = await authClient.organization.update({
          data: {
            name: value.organizationName,
            slug: value.organizationName.toLowerCase().replace(/\s+/g, '-'),
          },
          organizationId: activeOrg.id,
        })

        if (orgUpdateError) {
          return toast.error('Failed to update organization', {
            description: orgUpdateError.message,
          })
        }
        queryClient.invalidateQueries({
          queryKey: getOrganizationsQueryOptions.queryKey,
        })
        toast.success('Organization updated successfully')
      } else {
        return toast.warning('No active organization found')
      }
    },
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Organization details</CardTitle>
          <CardDescription>Manage your organization details</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              orgForm.handleSubmit()
            }}
            className="space-y-6"
          >
            <orgForm.AppField
              name="organizationName"
              validators={{
                onSubmit: ({ value }) => {
                  if (!value) return 'A valid name is required'

                  return undefined
                },
              }}
            >
              {(field) => <field.InputField label="Organization Name" />}
            </orgForm.AppField>

            <orgForm.AppForm>
              <orgForm.SubmitButton label="Update name" />
            </orgForm.AppForm>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-red-500/5 border border-red-500 mt-6">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Be careful in this section</CardDescription>
          <CardContent className="px-0">
            <List>
              <ListItem
                title="Delete your organization"
                description="Deleting your organization may have unwanted consequences. All data associated with this organization will get deleted and can not be recovered!"
                prefix={<Trash2 className="text-red-500" />}
                suffix={
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() =>
                      showDeleteOrgModal({
                        organizationId: activeOrg?.id || '',
                        organizationName: activeOrg?.name || '',
                      })
                    }
                  >
                    Delete organization
                  </Button>
                }
              />
            </List>
          </CardContent>
        </CardHeader>
      </Card>
    </>
  )
}

const APIKeyTab: FC = () => {
  const isMobile = useIsMobile()

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API Keys</CardDescription>
        </div>
        <Button size={isMobile ? 'icon' : 'sm'}>
          <span className="hidden lg:inline">Add new key</span>
          <PlusCircle />
        </Button>
      </CardHeader>
      <CardContent>
        <Collapsible className="flex max-w-xl flex-col gap-2">
          <div className="flex items-center justify-between gap-4 px-4">
            <h4 className="text-sm font-semibold flex items-center">
              <IconGlobe className="size-4" /> Yoswap
            </h4>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <ChevronsUpDown />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <List>
              <div className="flex flex-col gap-2 px-4">
                <FatInput
                  value={'pk_sdvbaosbdvobasd8v9asdviab'}
                  disabled
                  contentEditable={false}
                  suffix={
                    <Button size="icon" variant="ghost">
                      <Copy />
                    </Button>
                  }
                />
                <FatInput
                  value={'wk_sodasobobasdv98ab'}
                  disabled
                  contentEditable={false}
                  suffix={
                    <Button size="icon" variant="ghost">
                      <Copy />
                    </Button>
                  }
                />
              </div>
              <ListItem
                title="Ramp service"
                description="Enable api key to access the on/off ramp service"
                suffix={<Switch />}
              />
              <ListItem
                title="Wallet service"
                description="Enable api key to access the wallet service"
                suffix={<Switch />}
              />
              <ListItem
                title="Event service"
                description="Enable api key to access the event service"
                suffix={<Switch />}
              />
            </List>
          </CollapsibleContent>
        </Collapsible>
        <Separator />
      </CardContent>
    </Card>
  )
}

const TeamTab: FC = () => {
  const isMobile = useIsMobile()

  const { data: team } = useQuery(getTeamQueryOptions)
  const { data: invitations } = useQuery(getInvitationQueryOptions)

  const showInviteModal = () => {
    NiceModal.show(TeamInviteModal)
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Team</CardTitle>
          <CardDescription>Manage your Team</CardDescription>
        </div>
        <Button size={isMobile ? 'icon' : 'sm'} onClick={showInviteModal}>
          <span className="hidden lg:inline">Add team member</span>
          <PlusCircle />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <List>
          {team && team.total > 0 ? (
            team.members.map((member) => (
              <ListItem
                title={member.user.name}
                description={member.user.email}
                suffix={
                  <div className="inline-flex text-xs text-primary px-1 rounded-md border border-primary">
                    {member.role}
                  </div>
                }
                prefix={
                  <Avatar>
                    <AvatarImage
                      src={member.user.image as string | undefined}
                    />
                    <AvatarFallback>
                      {member.user.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                }
              />
            ))
          ) : (
            <div>No members yet</div>
          )}
        </List>
        <Separator className="my-4" />
        <List>
          {invitations && invitations.length ? (
            invitations.map((invite) => (
              <ListItem
                title={invite.email}
                description={invite.status}
                suffix={
                  <div className="inline-flex text-xs text-primary px-1 rounded-md border border-primary">
                    {invite.role}
                  </div>
                }
                prefix={
                  <Avatar>
                    <AvatarImage src={undefined as string | undefined} />
                    <AvatarFallback>
                      {invite.email.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                }
              />
            ))
          ) : (
            <div>No invitations yet</div>
          )}
        </List>
      </CardContent>
    </Card>
  )
}

const NotificationTab: FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your Notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <List>
          <ListItem
            title="Transactions"
            description="Get notified when a transaction occurs"
            suffix={<Switch />}
          />
          <ListItem
            title="Events"
            description="Get notified when an event is triggered"
            suffix={<Switch />}
          />
        </List>
      </CardContent>
    </Card>
  )
}
