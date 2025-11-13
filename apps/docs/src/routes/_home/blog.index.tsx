import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/blog/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/blog/"!</div>
}
