import { createRouter } from "@/lib/create-app";

import * as handlers from "./console.handlers";
import * as routes from "./console.routes";

const router = createRouter()
  .openapi(routes.transactionList, handlers.transactionList)
  .openapi(routes.walletList, handlers.walletList)
  .openapi(routes.eventList, handlers.eventList);

export default router;
