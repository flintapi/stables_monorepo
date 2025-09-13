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
  // IconUsers,
} from '@tabler/icons-react'

import { TeamSwitcher } from './team-switcher'
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
import { NavEvents } from '@/components/nav-events'

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
      title: 'Accounts',
      url: '/accounts',
      icon: IconListDetails,
    },
    {
      title: 'Project Settings',
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
      title: 'Get Help',
      url: '#',
      icon: IconHelp,
    },
    {
      title: 'Search',
      url: '#',
      icon: IconSearch,
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
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavEvents items={data.eventTypes} />
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" />*/}
      </SidebarContent>
      <SidebarFooter className="flex-1 justify-center">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
