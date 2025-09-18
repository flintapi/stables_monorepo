import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, BookIcon, GitGraph } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { BaseLink } from './-components/ConsoleLink'
import { Activities } from './-components/Activities'
import { Container, Main, Section } from '@/components/craft'
import { getOrganizationsQueryOptions } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { showCreateOrgModal } from './-components/modals/CreateOrganization'

export const Route = createFileRoute('/_authed/overview')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: orgList, error } = useQuery(getOrganizationsQueryOptions)

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
        {!orgList?.length ? (
          <div className="flex flex-col items-center justify-center">
            <h2>No Organizations Found</h2>
            <p className="text-sm text-secondary-foreground/75">
              You haven't joined any organizations yet.
            </p>
            <Button
              variant="default"
              size="lg"
              className="mt-3"
              onClick={showCreateOrgModal}
            >
              Create organization
            </Button>
          </div>
        ) : (
          <Activities />
        )}
      </Section>
    </Main>
  )
}
