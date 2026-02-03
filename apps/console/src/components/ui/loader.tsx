import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export const Loader: React.FC = (props: {className?: string}) => (
  <Loader2 className={cn("animate-spin m-0 transition-opacity duration-300 ease-in", props?.className)} />
)
