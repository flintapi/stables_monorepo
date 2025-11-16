import { createRouter } from "@/lib/create-app";

import * as handlers from "./webhooks.handlers";
import * as routes from "./webhooks.routes";

const router = createRouter()
  .openapi(routes.bellbank, handlers.bellbank)
  .openapi(routes.centiiv, handlers.centiiv)
  .openapi(routes.offramp, handlers.offramp)
  .openapi(routes.palmpayPaymentNotify, handlers.palmpayPaymentNotify);

export default router;
