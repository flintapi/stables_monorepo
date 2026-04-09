import * as React from 'react'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical, IconTrendingUp } from '@tabler/icons-react'
import { flexRender } from '@tanstack/react-table'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  Label as ChartLabel,
  Pie,
  PieChart,
} from 'recharts'
import type { z } from 'zod'

import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core'
import type { ColumnDef, Row, Table as TableType } from '@tanstack/react-table'
import type { ChartConfig } from '@/components/ui/chart'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

import { useIsMobile } from '@/hooks/use-mobile'

import { Button } from '@/components/ui/button'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { OrganizationTransaction, OrganizationWallet } from '@/lib/api-client'
import { Badge } from './ui/badge'
import { List, ListItem } from './ui/list'
import { Copy } from 'lucide-react'
import { TransactionTableContext } from './tables/transactions'

type RowSchema = z.ZodTypeAny

// Create a separate component for the drag handle
export function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

export function DraggableRow({ row }: { row: Row<z.infer<RowSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: (row.original as { id: string })?.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

interface GenTableType {
  id: string
  [key: string]: any
}

export function DataTable<T extends GenTableType>({
  data: initialData,
  columns,
  table,
}: {
  data: Array<T>
  columns: Array<ColumnDef<T>>
  table: TableType<T>
}) {
  const [data, setData] = React.useState(() => initialData)

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )

  const dataIds = React.useMemo<Array<UniqueIdentifier>>(
    () => data.map(({ id }) => id),
    [data],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setData((prevData) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  React.useEffect(() => {
    console.log('Re-render table on pagination', table.getState())
  })

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      id={sortableId}
    >
      <Table className="animate-fade-down">
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {table.getRowModel().rows.length ? (
            <SortableContext
              items={dataIds}
              strategy={verticalListSortingStrategy}
            >
              {table.getRowModel().rows.map((row) => (
                <DraggableRow key={row.id} row={row} />
              ))}
            </SortableContext>
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DndContext>
  )
}

const chartData = [
  { month: 'January', offramp: 186, onramp: 80 },
  { month: 'February', offramp: 305, onramp: 200 },
  { month: 'March', offramp: 237, onramp: 120 },
  { month: 'April', offramp: 73, onramp: 190 },
  { month: 'May', offramp: 209, onramp: 130 },
  { month: 'June', offramp: 214, onramp: 140 },
]

const chartConfig = {
  offramp: {
    label: 'Off-Ramp',
    color: 'var(--color-chart-1)',
  },
  onramp: {
    label: 'On-Ramp',
    color: 'var(--color-chart-2)',
  },
} satisfies ChartConfig

export function TransactionTableCellViewer({
  item,
}: {
  item: OrganizationTransaction
}) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.reference}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Transaction details</DrawerTitle>
          <DrawerDescription>
            Showing total transactions for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="offramp"
                    type="natural"
                    fill="var(--color-chart-1)"
                    fillOpacity={0.6}
                    stroke="var(--color-chart-1)"
                    stackId="a"
                  />
                  <Area
                    dataKey="onramp"
                    type="natural"
                    fill="var(--color-chart-2)"
                    fillOpacity={0.4}
                    stroke="var(--color-chart-2)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{' '}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
        </div>
        <DrawerFooter>
          <Button
            onClick={async () => {
              alert('Will resend transaction webhook request')
            }}
          >
            Resend webhook
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

const walletChartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 190, fill: 'var(--color-other)' },
]
const walletChartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: 'var(--chart-1)',
  },
  safari: {
    label: 'Safari',
    color: 'var(--chart-2)',
  },
  firefox: {
    label: 'Firefox',
    color: 'var(--chart-3)',
  },
  edge: {
    label: 'Edge',
    color: 'var(--chart-4)',
  },
  other: {
    label: 'Other',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig

export function WalletTableCellViewer<DataSchema extends OrganizationWallet>({
  item,
}: {
  item: DataSchema
}) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.id.slice(0, 10)}...
          {item.id.slice(-10)}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>
            Wallet details
            {item.keyLabel.split(':')[0].includes('master') && (
              <Badge
                variant="outline"
                className="text-muted-foreground px-1.5 mx-auto ml-2"
              >
                Master wallet
              </Badge>
            )}
          </DrawerTitle>
          <DrawerDescription>
            Showing details for wallet with id: <b>{item.id}</b>
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={walletChartConfig}>
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={walletChartData}
                    dataKey="visitors"
                    nameKey="browser"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <ChartLabel
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {'1000'}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Transactions
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="grid gap-2">
                {/*<div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{' '}
                  <IconTrendingUp className="size-4" />
                </div>*/}
                <div className="text-muted-foreground">
                  Showing total transactions for the wallet.
                </div>
              </div>
              <Separator />
            </>
          )}
          <List className="flex flex-col gap-4">
            <h4 className="text-prose">Addresses</h4>

            {item.addresses.map((address) => (
              <>
                <ListItem
                  title={address.network.toUpperCase()}
                  description={`${address.address.slice(0, 12)}...${address.address.slice(-12)}`}
                  suffix={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigator.clipboard.writeText(address.address)
                      }
                    >
                      <Copy />
                    </Button>
                  }
                />
              </>
            ))}
          </List>
          <List className="flex flex-col gap-4">
            <h4 className="text-prose">Linked Virtual accounts</h4>

            {(item.metadata.linkedVirtualAccounts as any[]).map((account) => (
              <>
                <ListItem
                  title={account.network.toUpperCase()}
                  description={`${account.accountNumber}`}
                  suffix={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigator.clipboard.writeText(account.accountNumber)
                      }
                    >
                      <Copy />
                    </Button>
                  }
                />
              </>
            ))}
          </List>
        </div>
        <DrawerFooter>
          <Button>New Transaction</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
