import {createRouter} from "@/lib/create-app";
import * as routes from "./spec-ops.routes";
import * as handlers from "./spec-ops.handler"
const router = createRouter()
  .openapi(routes.createAutofund, handlers.createAutofunder)
  .openapi(routes.getTradeQuote, handlers.getTradeQuote)
  .openapi(routes.executeTrade, handlers.executeTrade)


export default router;
