import { createFileRoute } from '@tanstack/react-router'
import { List } from 'lucide-react'
import { Container, Main, Section } from '@/components/craft'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_authed/transactions')({
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
                  <List className="dark:text-black text-white size-5" />
                </div>
                <h2 className="text-lg font-bold font-sans">
                  No transactions yet
                </h2>
                <p className="text-sm text-muted-foreground text-balance text-ellipsis lg:max-w-sm text-center">
                  On/Off ramp and Payment transactions will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </Main>
  )
}
