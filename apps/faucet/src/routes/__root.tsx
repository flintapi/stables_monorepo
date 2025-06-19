import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

// import Header from '../components/Header'

import TanstackQueryLayout from '../integrations/tanstack-query/layout'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { Layout } from '@/components/craft'
import { Toaster } from '@/components/ui/sonner'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'FlintAPI Faucet',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/icon.png',
      },
    ],
  }),

  component: () => (
    <RootDocument>
      {/* <Header /> */}

      <Outlet />
      {/* <TanStackRouterDevtools />

      <TanstackQueryLayout /> */}
    </RootDocument>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider storageKey="faucet-ui-theme" defaultTheme="dark">
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
        <Scripts />
      </body>
    </Layout>
  )
}
