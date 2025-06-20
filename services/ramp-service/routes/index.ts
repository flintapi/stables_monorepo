import { createRouter } from "@/lib-core/create-app";

import * as offHandlers from "./off/handlers";
import * as offRoutes from "./off/routes";
import * as onHandlers from "./on/handlers";
import * as onRoutes from "./on/routes";

const router = createRouter()
  .openapi(offRoutes.getQuote, offHandlers.getQuote)
  .openapi(offRoutes.finalize, offHandlers.finalize)
  .openapi(onRoutes.getQuote, onHandlers.getQuote)
  .openapi(onRoutes.finalize, onHandlers.finalize);

export default router;
