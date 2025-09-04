import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed')({
  component: RouteComponent,
})

function RouteComponent() {
  const routerState = useRouterState()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* Add page prop */}
        <SiteHeader page={routerState.location.pathname.slice(1)} />
        <div className="flex flex-col flex-1">
          <div className='@container/main flex flex-1 flex-col gap-2'>
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
