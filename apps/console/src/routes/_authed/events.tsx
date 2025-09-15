import { createFileRoute } from '@tanstack/react-router'
import { Shapes, Sparkle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container, Main, Section } from '@/components/craft'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_authed/events')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Main>
      <Section className="animate-fade-down">
        <Container className="">
          <Card className="bborder-dashed bg-gray-400/15 border-gray-500">
            <CardContent>
              <div className="flex flex-col items-center justify-center min-h-3xl">
                <div className="p-2 border border-gray-400 bg-black  rounded-sm my-2">
                  <Sparkle className="dark:text-black text-white size-5" />
                </div>
                <h2 className="text-lg font-bold font-sans">No events</h2>
                <p className="text-sm text-muted-foreground text-balance text-ellipsis lg:max-w-md text-center">
                  Subscribe to events triggered by wallets to receive
                  notifications on deposits, withdrawals, contract calls.
                </p>
                <Button className="my-4">Subscribe to event</Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </Main>
  )
}
