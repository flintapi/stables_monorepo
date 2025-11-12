import { Book, List } from 'lucide-react'
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from 'fumadocs-ui/layouts/home/navbar'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'FlintAPI',
    },
    links: [
      {
        type: 'custom',
        secondary: false,
        // only displayed on navbar, not mobile menu
        on: 'nav',
        children: (
          <NavbarMenu>
            <NavbarMenuTrigger>Documentation</NavbarMenuTrigger>
            <NavbarMenuContent>
              <NavbarMenuLink href="/docs">Get started</NavbarMenuLink>
            </NavbarMenuContent>
          </NavbarMenu>
        ),
      },
      {
        text: 'Blog',
        icon: <Book />,
        url: '/blog',
        active: 'nested-url',
      },
    ],
  }
}
