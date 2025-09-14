import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
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
import { IconHttpDelete } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export const Route = createFileRoute(`/_authed/settings`)({
  component: RouteComponent,
})

function RouteComponent() {
  const orgForm = useConsoleForm({
    defaultValues: {
      organizationName: '',
    },
    validators: {
      onChange: z.object({
        organizationName: z.string().min(4).max(124),
      }),
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 4000))
      alert(value.organizationName)
    },
  })

  const isMobile = useIsMobile()

  return (
    <Main>
      <Section className="animate-fade-down">
        <Container className="">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="api-keys">
                API Keys <Badge>3</Badge>
              </TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="md:max-w-3xl">
              <Card>
                <CardHeader>
                  <CardTitle>Organization details</CardTitle>
                  <CardDescription>
                    Manage your organization details
                  </CardDescription>
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
                      {(field) => (
                        <field.InputField label="Organization Name" />
                      )}
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
                          <Button size="lg" variant="destructive">
                            Delete organization
                          </Button>
                        }
                      />
                    </List>
                  </CardContent>
                </CardHeader>
              </Card>
            </TabsContent>
            <TabsContent value="api-keys" className="md:max-w-3xl">
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
                <CardContent></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="team" className="md:max-w-3xl">
              <div>Team</div>
            </TabsContent>
          </Tabs>
        </Container>
      </Section>
    </Main>
  )
}
