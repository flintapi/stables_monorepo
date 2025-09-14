import { Suspense } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, BookIcon, GitGraph } from 'lucide-react'
import { BaseLink } from './-components/ConsoleLink'
import { Loader } from './-components/loader'
import { DataTable } from '@/components/data-table'
import { Container, Main, Section } from '@/components/craft'

export const Route = createFileRoute('/_authed/overview')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Main>
      <Section className="animate-fade-down">
        <Container className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            to="/wallets"
            params={{ chainId: 1112111 }}
            className="grid gap-4 items-start border border-gray-500/75 hover:border-gray-500 transition-all p-4 rounded-md"
          >
            <div className="flex w-full items-center justify-between">
              <GitGraph />
              <ArrowUpRight className="size-4" />
            </div>
            <div>
              <h2>Analytics</h2>
              <span className="text-sm text-secondary-foreground/75">
                Dive deep into asset performance and wallet health
              </span>
            </div>
          </Link>
          <BaseLink
            href="https://stables.flintapi.io/docs"
            className="grid gap-4 items-start border border-gray-500/75 hover:border-gray-500 transition-all p-4 rounded-md"
          >
            <div className="flex w-full items-center justify-between">
              <BookIcon />
              <ArrowUpRight className="size-4" />
            </div>
            <div>
              <h2>Documentation</h2>
              <span className="text-sm text-secondary-foreground/75">
                Get started with our API/SDKs for seamless integrations
              </span>
            </div>
          </BaseLink>
        </Container>
      </Section>
      <Section>
        <Activities />
      </Section>
    </Main>
  )
}

const Activities: React.FC = () => {
  return (
    <Suspense fallback={<Loader />}>
      {(async () => {
        const data = (await import('@/app/dashboard/data.json')).default

        return (
          <Container className="animate-fade-down">
            <h1 className="text-3xl lg:text-2xl font-semibold font-sans my-4">
              Activities
            </h1>
            <DataTable data={data} />
          </Container>
        )
      })()}
    </Suspense>
  )
}
