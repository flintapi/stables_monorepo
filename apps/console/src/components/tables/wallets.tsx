import { createContext, useMemo, useState } from 'react'
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
} from '@tabler/icons-react'
import type { z } from 'zod'
import type { FC } from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  Table,
  VisibilityState,
} from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  DragHandle,
  WalletTableCellViewer,
} from '@/components/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  getOrganizationWalletsQueryOptions,
  OrganizationWallet,
} from '@/lib/api-client'
import { Switch } from '../ui/switch'
import { cn } from '@/lib/utils'

export const WalletTableContext = createContext<{
  table: Table<OrganizationWallet>
}>({ table: {} as any })

const columns: Array<ColumnDef<OrganizationWallet>> = [
  // {
  //   id: 'drag',
  //   header: () => null,
  //   cell: ({ row }) => <DragHandle id={row.original.id} />,
  // },
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: 'Wallet ID',
    cell: ({ row }) => {
      // const isAssigned = row.original.reviewer !== 'Assign reviewer'

      // if (isAssigned) {
      //   return row.original.reviewer
      // }

      return <WalletTableCellViewer item={row.original} />
    },
  },
  {
    accessorKey: 'primaryAddress',
    header: 'Primary Address',
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.primaryAddress.slice(0, 8)}...
          {row.original.primaryAddress.slice(-10)}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.isActive ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 size-[20px]" />
        ) : (
          <IconLoader />
        )}
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    accessorKey: 'autoSwap',
    header: () => <div className="w-full text-right">Auto Swap</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Switch defaultChecked={row.original.autoSwap} />
      </div>
      // <form
      //   onSubmit={(e) => {
      //     e.preventDefault()
      //     toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      //       loading: `Updating wallet: ${row.original.primaryAddress}`,
      //       success: 'Done',
      //       error: 'Error',
      //     })
      //   }}
      // >
      //   <Label htmlFor={`${row.original.id}-target`} className="sr-only">
      //     Auto Swap
      //   </Label>
      // </form>
    ),
  },
  {
    accessorKey: 'autoSweep',
    header: () => <div className="w-full text-right">Auto Sweep</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Switch defaultChecked={row.original.autoSweep} />
      </div>
      // <form
      //   onSubmit={(e) => {
      //     e.preventDefault()
      //     toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      //       loading: `Update wallet ${row.original.primaryAddress}`,
      //       success: 'Done',
      //       error: 'Error',
      //     })
      //   }}
      // >
      //   <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
      //     Auto Sweep
      //   </Label>
      // </form>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem className={cn('bg-accent')}>
            {row.original.isActive ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
          <DropdownMenuItem>Get QRCode</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export const WalletsTable: FC = () => {
  const { data: wallets, error } = useSuspenseQuery(
    getOrganizationWalletsQueryOptions,
  )

  if (wallets) {
    console.log('Wallets', wallets)
  }

  if (error) {
    console.log('Error getting wallets:', error)
  }

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data: wallets,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const contextValue = useMemo(
    () => ({ table, pagination }),
    [table, pagination],
  )

  return (
    <WalletTableContext.Provider value={contextValue}>
      <DataTable data={wallets} columns={columns} table={contextValue.table} />
      <div className="flex items-center justify-between px-4 my-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </WalletTableContext.Provider>
  )
}
