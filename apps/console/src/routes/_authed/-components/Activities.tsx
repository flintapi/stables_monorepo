import { Suspense, use, useState } from 'react'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from '@tabler/icons-react'
import type { FC } from 'react'
import { Loader } from '@/components/ui/loader'
import { Container } from '@/components/craft'
import { DataTable } from '@/components/data-table'
import {
  // TransactionTableContext,
  TransactionsTable,
} from '@/components/tables/transactions'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ActivityTabs = 'transactions' | 'wallets' | 'events'

export const Activities: FC = () => {
  const [tab, setTab] = useState<ActivityTabs>('transactions')
  // const { table } = use(TransactionTableContext)

  return (
    <Container className="animate-fade-down">
      <h1 className="text-3xl lg:text-2xl font-semibold font-sans my-4">
        Activities
      </h1>
      <Tabs
        value={tab}
        defaultValue={tab}
        className="w-full flex-col justify-start gap-6"
        onValueChange={(value) => setTab(value as ActivityTabs)}
      >
        <div className="flex items-center justify-between">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select
            value={tab}
            defaultValue={tab}
            onValueChange={(value: ActivityTabs) => setTab(value)}
          >
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactions">Transactions</SelectItem>
              <SelectItem value="wallets">Wallets</SelectItem>
              <SelectItem value="events">Events</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="transactions">
              Transactions <Badge variant="secondary">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="wallets">
              Wallets <Badge variant="secondary">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="events">
              Events <Badge variant="secondary">3</Badge>
            </TabsTrigger>
          </TabsList>
          {/*<div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== 'undefined' &&
                      column.getCanHide(),
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm">
              <IconPlus />
              <span className="hidden lg:inline">Add Section</span>
            </Button>
          </div>*/}
        </div>
        <TabsContent
          value="transactions"
          className="relative flex flex-col gap-4 overflow-auto"
        >
          <div className="overflow-hidden rounded-lg border">
            <Suspense fallback={<Loader />}>
              <TransactionsTable />
            </Suspense>
          </div>
        </TabsContent>
        <TabsContent value="wallets" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent value="events" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
      </Tabs>
    </Container>
  )
}
