'use client'

import * as React from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'

import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { showCreateOrgModal } from '@/routes/_authed/-components/modals/CreateOrganization'
import { authClient } from '@/lib/auth-client'
import * as queryOptions from '@/lib/api-client'

export function TeamSwitcher({
  teams,
}: {
  teams: Array<{
    name: string
    logo: React.ElementType
    slug: string
    id: string
  }>
}) {
  const { isMobile } = useSidebar()
  const queryClient = useQueryClient()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  // React.useEffect(() => {
  //   setActiveTeam(teams[0])
  // }, [teams])

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.slug}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={async () => {
                  setActiveTeam(team)
                  const { data, error } =
                    await authClient.organization.setActive({
                      organizationId: team.id,
                      organizationSlug: team.slug,
                    })

                  if (error) {
                    return toast.error('Failed to set active organization', {
                      description: error.message,
                    })
                  }

                  for (const option of Object.values(queryOptions)) {
                    queryClient.invalidateQueries({
                      queryKey: option.queryKey,
                    })
                  }
                  toast.success('Active organization set successfully')
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={showCreateOrgModal}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Add organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
