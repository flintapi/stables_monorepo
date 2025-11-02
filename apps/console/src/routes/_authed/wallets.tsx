import { createFileRoute } from '@tanstack/react-router'
import { Shapes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container, Main, Section } from '@/components/craft'
import { Card, CardContent } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { getOrganizationWalletsQueryOptions } from '@/lib/api-client'

export const Route = createFileRoute(`/_authed/wallets`)({
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = useQuery(getOrganizationWalletsQueryOptions)

  console.log('Wallet data', data)

  return (
    <Main>
      <Section className="animate-fade-down">
        <Container className="">
          <Card className="bborder-dashed bg-gray-400/15 border-gray-500">
            <CardContent>
              <div className="flex flex-col items-center justify-center min-h-3xl">
                <div className="p-2 border border-gray-400 bg-black  rounded-sm my-2">
                  <Shapes className="dark:text-black text-white size-5" />
                </div>
                <h2 className="text-lg font-bold font-sans">
                  No wallets created
                </h2>
                <p className="text-sm text-muted-foreground text-balance text-ellipsis lg:max-w-sm text-center">
                  Create and configure wallets from the dashboard or with our
                  SDK
                </p>
                <Button className="my-4">Create new</Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </Main>
  )
}
