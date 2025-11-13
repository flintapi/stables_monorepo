import { createFileRoute, notFound } from '@tanstack/react-router'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { createServerFn } from '@tanstack/react-start'
import { useMemo } from 'react'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { createClientLoader } from 'fumadocs-mdx/runtime/vite'
import { MessageCircleCode } from 'lucide-react'
import type * as PageTree from 'fumadocs-core/page-tree'
import { docs } from '@/.source'
import { source } from '@/lib/source'
import { baseOptions } from '@/lib/layout.shared'

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? []
    const data = await loader({ data: slugs })
    await clientLoader.preload(data.path)
    return data
  },
  notFoundComponent: (config) => (
    <div>
      Could not find the Route: <pre>{JSON.stringify(config, null, 3)}</pre>
    </div>
  ),
})

const loader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: Array<string>) => slugs)
  .handler(({ data: slugs }) => {
    // Async function if a promise is used
    const page = source.getPage(slugs)
    if (!page) throw notFound()

    return {
      tree: source.pageTree as object,
      path: page.path,
    }
  })

const clientLoader = createClientLoader(docs.doc, {
  id: 'docs',
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...defaultMdxComponents,
            }}
          />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const data = Route.useLoaderData()
  const Content = clientLoader.getComponent(data.path)
  const tree = useMemo(
    () => transformPageTree(data.tree as PageTree.Folder),
    [data.tree],
  )

  return (
    <DocsLayout
      {...baseOptions()}
      links={[
        {
          type: 'main',
          text: 'Token Faucet',
          url: 'https://faucet.flintapi.io',
          external: true,
        },
        {
          type: 'main',
          text: 'Merchant Console',
          url: 'https://console.flintapi.io',
          external: true,
        },
      ]}
      tree={tree}
      themeSwitch={{ enabled: false }}
      sidebar={{
        banner: (
          <div
            className="p-2 flex items-center justify-between bg-accent rounded-md hover:cursor-pointer"
            onClick={() => {
              const message = prompt('Enter feedback below')
              console.log('MEssage to send to feedback API', message)
            }}
          >
            Give Feedback
            <MessageCircleCode className="size-4" />
          </div>
        ),
      }}
    >
      <Content />
    </DocsLayout>
  )
}

function transformPageTree(root: PageTree.Root): PageTree.Root {
  function mapNode<T extends PageTree.Node>(item: T): T {
    if (typeof item.icon === 'string') {
      item = {
        ...item,
        icon: (
          <span
            dangerouslySetInnerHTML={{
              __html: item.icon,
            }}
          />
        ),
      }
    }

    if (item.type === 'folder') {
      return {
        ...item,
        index: item.index ? mapNode(item.index) : undefined,
        children: item.children.map(mapNode),
      }
    }

    return item
  }

  return {
    ...root,
    children: root.children.map(mapNode),
    fallback: root.fallback ? transformPageTree(root.fallback) : undefined,
  }
}
