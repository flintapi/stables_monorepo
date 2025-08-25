import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { bellbankCronListener } from "./lib/crons/bellbank.cron";

const port = env.PORT;

// Register cron listener
bellbankCronListener()
// eslint-disable-next-line no-console
console.log(`Server is running on port http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
