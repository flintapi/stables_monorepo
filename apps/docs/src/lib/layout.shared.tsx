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
      title: (
        <>
          <img src={`/icon.png`} alt="Logo" className="object-cover size-8" />
          <h2 className="font-bold font-sans text-sm">Flint API</h2>
        </>
      ),
      transparentMode: 'top',
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url',
        // only displayed on navbar, not mobile menu
        // on: 'nav',
        // children: (
        //   <NavbarMenu>
        //     <NavbarMenuTrigger>Documentation</NavbarMenuTrigger>
        //     <NavbarMenuContent>
        //       <NavbarMenuLink href="/docs">Get started</NavbarMenuLink>
        //     </NavbarMenuContent>
        //   </NavbarMenu>
        // ),
      },
      {
        text: 'Blog',
        url: '/blog',
        active: 'nested-url',
      },
      {
        text: 'Showcase',
        url: '/showcase',
        active: 'nested-url',
      },
    ],
  }
}
