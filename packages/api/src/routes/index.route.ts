import { QueueInstances } from "@flintapi/shared/Queue";
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

import { createRouter } from "@/lib/create-app";

const rampQueue = QueueInstances["ramp-queue"];

const router = createRouter()
  .openapi(
    createRoute({
      tags: ["Index"],
      method: "get",
      path: "/",
      responses: {
        [HttpStatusCodes.OK]: jsonContent(
          createMessageObjectSchema("Tasks API"),
          "Tasks API Index",
        ),
      },
    }),
    async (c) => {
      // add job to queue
      await rampQueue.add("off-ramp", { data: {
        type: "off",
        amount: 5000,
        network: "base",
      } }, {
        jobId: `ramp:off:${crypto.randomUUID()}`,
        attempts: 2,
        removeOnFail: { age: 24 * 3600 },
      });

      return c.json({
        message: "Tasks API",
      }, HttpStatusCodes.OK);
    },
  );

export default router;
