import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertCircleIcon, ArrowUpRight, BookIcon, GitGraph } from 'lucide-react'
import { QueryErrorResetBoundary, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BaseLink } from './-components/ConsoleLink'
import { Activities } from './-components/Activities'
import { showCreateOrgModal } from './-components/modals/CreateOrganization'
import { Container, Main, Section } from '@/components/craft'
import { getOrganizationsQueryOptions } from '@/lib/api-client'
import { ErrorBoundary } from 'react-error-boundary'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/_authed/overview')({
  component: RouteComponent,
  errorComponent: ({ error }) => {
    toast.error(error.name, {
      description: error.message,
    })
  },
})

function RouteComponent() {
  const { data: orgList, error } = useQuery(getOrganizationsQueryOptions)

  if (error) {
    toast.error('Failed to get organizations', {
      description: error.message,
    })
  }

  return (
    <Main>
      <Section className="animate-fade-down">
        <Container className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            to="/wallets"
            disabled
            params={{ chainId: 1112111 }}
            className="grid gap-4 items-start border border-gray-500/75 hover:border-gray-500 transition-all p-4 rounded-md"
          >
            <div className="flex w-full items-center justify-between">
              <GitGraph />
              <ArrowUpRight className="size-4" />
            </div>
            <div>
              <h2>Wallet Analytics</h2>
              <span className="text-sm text-secondary-foreground/75">
                Dive deep into asset performance and wallet health
              </span>
            </div>
          </Link>
          <BaseLink
            href="https://flintapi.io/docs"
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
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                fallbackRender={({ resetErrorBoundary }) => (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>Unable to load data.</AlertTitle>
                    <AlertDescription>
                      <p>
                        Please verify your internet connection, or make sure you
                        have created an API key and carried out a transaction.
                      </p>
                      <ul className="list-inside list-disc text-sm">
                        <li>Check your internet connection</li>
                        <li>Ensure API Key is created</li>
                        <li>Transaction has been created</li>
                      </ul>
                    </AlertDescription>
                    <Button
                      onClick={() => resetErrorBoundary()}
                      variant="secondary"
                      size="default"
                    >
                      Try again
                    </Button>
                  </Alert>
                )}
              >
                <Activities />
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        )}
      </Section>
    </Main>
  )
}
