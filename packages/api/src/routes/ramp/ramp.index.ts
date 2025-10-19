import { createRouter } from "@/lib/create-app";
import * as routes from "./ramp.routes"
import * as handlers from "./ramp.handlers"


const router = createRouter()
  .openapi(routes.ramp, handlers.ramp)
  .openapi(routes.banks, handlers.banks)
  .openapi(routes.transaction, handlers.transaction)


export default router;
