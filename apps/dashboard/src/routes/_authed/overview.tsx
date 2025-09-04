import { DataTable } from '@/components/data-table'
import { createFileRoute } from '@tanstack/react-router'
import data from "@/app/dashboard/data.json"

export const Route = createFileRoute('/_authed/overview')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='px-4 lg:px-6'>
      <DataTable data={data} />
    </div>
  )
}
