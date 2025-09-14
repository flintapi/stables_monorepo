import { createFileRoute } from '@tanstack/react-router'
import { Container, Main, Section } from '@/components/craft'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute(`/_authed/settings`)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Main>
      <Section className="animate-fade-down">
        <Container className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="api-keys">
                API Keys <Badge>3</Badge>
              </TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="bg-gray-500/95 w-full">
              <div>Details</div>
            </TabsContent>
            <TabsContent value="api-keys">
              <div>API Keys</div>
            </TabsContent>
            <TabsContent value="team">
              <div>Team</div>
            </TabsContent>
          </Tabs>
        </Container>
      </Section>
    </Main>
  )
}
