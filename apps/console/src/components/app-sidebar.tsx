import * as React from 'react'
import {
  IconBread,
  IconCamera,
  // IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  // IconFileWord,
  // IconFolder,
  IconHelp,
  // IconInnerShadowTop,
  IconListDetails,
  IconMoneybag,
  IconReport,
  IconSearch,
  IconSettings,
  IconWallet,
  // IconUsers,
} from '@tabler/icons-react'

import { List, Sparkle, Wallet } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TeamSwitcher } from './team-switcher'
import { NavSecondary } from './nav-secondary'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { NavMain } from '@/components/nav-main'
// import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  // SidebarMenu,
  // SidebarMenuButton,
  // SidebarMenuItem,
} from '@/components/ui/sidebar'
import { getOrganizationsQueryOptions } from '@/lib/api-client'
import { showCreateOrgModal } from '@/routes/_authed/-components/modals/CreateOrganization'
import { authClient } from '@/lib/auth-client'
import { env } from '@/env'
// import { NavEvents } from '@/components/nav-events'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Overview',
      url: '/overview',
      icon: IconDashboard,
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: IconSettings,
    },
  ],
  navClouds: [
    {
      title: 'Capture',
      icon: IconCamera,
      isActive: true,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Proposal',
      icon: IconFileDescription,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Prompts',
      icon: IconFileAi,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Wallets',
      url: '/wallets',
      icon: Wallet,
    },
    {
      title: 'Events',
      url: '/events',
      icon: Sparkle,
    },
    {
      title: 'Transactions',
      url: '/transactions',
      icon: List,
    },
  ],
  eventTypes: [
    {
      name: 'Webhooks',
      url: '#',
      icon: IconDatabase,
    },
    {
      name: 'Blockchain',
      url: '#',
      icon: IconReport,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { data: session, error: sessionError } = authClient.useSession()

  console.log('Session', session)

  const { data: orgList, error } = useQuery(getOrganizationsQueryOptions)

  if (sessionError) {
    toast.error('Failed to load session', {
      description: sessionError.message,
      action: {
        onClick: async () => {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.invalidate()
                router.navigate({
                  to: '/auth',
                  replace: true,
                  resetScroll: true,
                  search: { redirect: `${env.VITE_APP_URL}/overview` },
                })
              },
            },
          })
        },
        label: 'Refresh',
      },
    })
  }

  if (error) {
    toast.error('Failed to fetch organizations', {
      description: error.message,
    })
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        {orgList && orgList.length ? (
          <TeamSwitcher
            teams={orgList.map((org) => ({
              id: org.id,
              slug: org.slug,
              name: org.name,
              logo: () => (
                <Avatar>
                  <AvatarImage
                    src={org.logo as string | undefined}
                    className="sepia"
                  />
                  <AvatarFallback>
                    {org.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ),
            }))}
          />
        ) : (
          <Button variant="default" size="lg" onClick={showCreateOrgModal}>
            Create organization
          </Button>
        )}
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <NavMain items={data.navMain} />
        {/*<NavEvents items={data.navSecondary} />*/}
        <NavSecondary items={data.navSecondary} className="" />
      </SidebarContent>
      <SidebarFooter className="justify-center">
        <NavUser
          user={
            session?.user
              ? {
                  name: session.user.name,
                  email: session.user.email,
                  avatar: (session.user as { image: string | undefined }).image,
                }
              : { name: 'Loading...', email: 'Loading...', avatar: undefined }
          }
        />
      </SidebarFooter>
    </Sidebar>
  )
}
