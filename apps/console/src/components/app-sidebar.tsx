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
import { useRouteContext } from '@tanstack/react-router'
import { TeamSwitcher } from './team-switcher'
import { NavSecondary } from './nav-secondary'
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
  const { session } = useRouteContext({ from: '/_authed' })

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            {
              plan: 'Pro',
              name: 'Bread Africa',
              logo: () => <IconBread className="size-5" />,
            },
            {
              plan: 'Full access',
              name: 'Use Azza',
              logo: () => <IconMoneybag className="size-5" />,
            },
          ]}
        />
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <NavMain items={data.navMain} />
        {/*<NavEvents items={data.navSecondary} />*/}
        <NavSecondary items={data.navSecondary} className="" />
      </SidebarContent>
      <SidebarFooter className="justify-center">
        <NavUser
          user={{
            name: session.user.name,
            email: session.user.email,
            avatar: session.user.image as string,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
