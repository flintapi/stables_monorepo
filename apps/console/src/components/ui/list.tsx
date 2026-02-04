import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ListProps {
  children: ReactNode
  className?: string
}

export function List({ children, className }: ListProps) {
  return <div className={cn('space-y-0', className)}>{children}</div>
}

interface ListItemProps {
  prefix?: ReactNode
  suffix?: ReactNode
  title: string
  description?: string
  className?: string
  borderLast?: boolean
}

export function ListItem({
  prefix,
  suffix,
  title,
  description,
  className,
  borderLast = false,
}: ListItemProps) {
  return (
    <div
      className={cn(
        'grid lg:flex items-center gap-4 p-4 border-border ',
        {
          "last:border-b-1": borderLast,
          "border-b": !borderLast,
        },
        className,
      )}
    >
      {prefix && (
        <div className="flex-shrink-0 text-muted-foreground">{prefix}</div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-balance">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            {description}
          </p>
        )}
      </div>

      {suffix && <div className="flex-shrink-0">{suffix}</div>}
    </div>
  )
}
