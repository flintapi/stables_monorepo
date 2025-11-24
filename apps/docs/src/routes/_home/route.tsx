import { Outlet, createFileRoute } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { baseOptions } from '@/lib/layout.shared'
import ThemeToggle from '@/components/mode-toggle'

export const Route = createFileRoute('/_home')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <HomeLayout
      {...baseOptions()}
      themeSwitch={{
        enabled: true,
        component: <ThemeToggle />,
        mode: 'light-dark-system',
      }}
    >
      <Outlet />
    </HomeLayout>
  )
}
