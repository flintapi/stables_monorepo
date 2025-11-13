import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/showcase/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_home/showcase/"!</div>
}
