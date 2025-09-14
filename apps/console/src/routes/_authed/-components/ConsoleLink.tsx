// import { createLink } from '@tanstack/react-router'
import { forwardRef } from 'react'
// import type { LinkComponent } from '@tanstack/react-router'

interface BaseLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string
  to?: string
}

export const BaseLink = forwardRef<HTMLAnchorElement, BaseLinkProps>(
  (props, ref) => {
    return <a ref={ref} {...props} />
  },
)

// const Link = createLink(BaseLink)

// export const ConsoleLink: LinkComponent<typeof BaseLink> = (props) => {
//   return <Link preload="intent" {...props} />
// }
