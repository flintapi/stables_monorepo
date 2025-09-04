import {createFileRoute} from "@tanstack/react-router"


export const Route = createFileRoute(`/_authed/settings`)({
  component: RouteComponent
})


function RouteComponent() {
  return (<div>_authed/settings</div>)
}
