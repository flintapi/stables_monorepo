import NiceModal from '@ebay/nice-modal-react'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'

import StoreDevtools from '../lib/demo-store-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
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
        title: 'FlintAPI Merchant Console',
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
        type: 'image/x-icon',
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: () => <div>Not found route...</div>,
  // errorComponent: ({ error }) => <div>{JSON.stringify(error, null, 4)}</div>,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <NiceModal.Provider>
      <Layout>
        <head>
          <HeadContent />
        </head>
        <body>
          {children}
          <Toaster expand />
          <TanstackDevtools
            config={{
              position: 'bottom-left',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              StoreDevtools,
              TanStackQueryDevtools,
            ]}
          />
          <Scripts />
        </body>
      </Layout>
    </NiceModal.Provider>
  )
}
