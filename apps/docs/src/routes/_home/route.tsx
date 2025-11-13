import { Outlet, createFileRoute } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { baseOptions } from '@/lib/layout.shared'

export const Route = createFileRoute('/_home')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <HomeLayout {...baseOptions()}>
      <Outlet />
    </HomeLayout>
  )
}
