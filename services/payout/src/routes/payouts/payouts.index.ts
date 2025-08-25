import { createRouter } from "@/lib/create-app";

import * as handlers from "./payouts.handlers";
import * as routes from "./payouts.routes";

const router = createRouter()
  .openapi(routes.payout, handlers.payout)
  .openapi(routes.listBanks, handlers.listBanks)
  .openapi(routes.collectionAddress, handlers.collectionAddress);

export default router;
