import { Link, useMatchRoute } from '@tanstack/react-router'
import type { Icon } from '@tabler/icons-react'

// import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: Array<{
    title: string
    url: string
    icon?: Icon
  }>
}) {
  const { toggleSidebar, isMobile } = useSidebar()
  const matchRoute = useMatchRoute()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                onClick={() => {
                  if (isMobile) {
                    toggleSidebar()
                  }
                }}
                isActive={
                  matchRoute({ to: item.url, fuzzy: true }) ? true : false
                }
              >
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
