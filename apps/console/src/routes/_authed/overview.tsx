import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Container, Main, Section } from '@/components/craft'

export const Route = createFileRoute('/_authed/overview')({
  component: RouteComponent,
  // loader: async () => {
  //   const request = getWebRequest()
  //   console.log('Headers', request.headers)
  //   const { data: session, error } = await authClient.getSession({
  //     fetchOptions: { headers: request.headers },
  //   })
  //   return { session }
  // },
})

function RouteComponent() {
  return (
    <Main>
      <Section className="grid grid-cols-1 md:grid-cols-2 animate-fade-down">
        <Container>
          <div>Analytics</div>
        </Container>
        <Container>
          <div>Documentation</div>
        </Container>
      </Section>
      <Section>
        <Activities />
      </Section>
    </Main>
  )
}

const Loader: React.FC = () => (
  <Loader2 className="animate-spin m-auto transition-opacity duration-300 ease-in" />
)

const Activities: React.FC = () => {
  return (
    <Suspense fallback={<Loader />}>
      {(async () => {
        await new Promise((resolve) => setTimeout(resolve, 4000))
        const data = (await import('@/app/dashboard/data.json')).default

        return (
          <Container className="animate-fade-down">
            <DataTable data={data} />
          </Container>
        )
      })()}
    </Suspense>
  )
}
