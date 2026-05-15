import {createRouter} from "@/lib/create-app";
import * as routes from "./spec-ops.routes";
import * as handlers from "./spec-ops.handler"
const router = createRouter()
  .openapi(routes.createAutofund, handlers.createAutofunder)
  .openapi(routes.getOnrampQuote, handlers.getOnrampQuote)
  .openapi(routes.getOfframpQuote, handlers.getOfframpQuote)
  .openapi(routes.executeOfframpTrade, handlers.executeOfframpTrade)
  .openapi(routes.executeOnrampTrade, handlers.executeOnrampTrade)


export default router;
