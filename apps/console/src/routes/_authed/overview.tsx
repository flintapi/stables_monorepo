import { createFileRoute } from '@tanstack/react-router'
import { DataTable } from '@/components/data-table'
import data from '@/app/dashboard/data.json'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authed/overview')({
  component: RouteComponent,
  // loader: async () => {
  //   const request = getWebRequest()
  //   console.log('Headers', request.headers)
  //   const { data: session, error } = await authClient.getSession({
  //     fetchOptions: { headers: request.headers },
  //   })
  //   return { session }
  // },
})

function RouteComponent() {
  return (
    <div className="px-4 lg:px-6">
      <DataTable data={data} />
    </div>
  )
}
