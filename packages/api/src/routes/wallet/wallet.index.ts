import { createRouter } from "@/lib/create-app";
import * as routes from "./wallet.routes";
import * as handlers from "./wallet.handlers";

const router = createRouter()
  .openapi(routes.create, handlers.create)
  .openapi(routes.list, handlers.list)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.update, handlers.update)
  .openapi(routes.operation, handlers.operation)
  .openapi(routes.getWalletData, handlers.data);

export default router;
