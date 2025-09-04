import {createFileRoute} from "@tanstack/react-router"


export const Route = createFileRoute(`/_authed/accounts`)({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div>_authed/accounts</div>
  );
}
