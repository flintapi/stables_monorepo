import { config } from "dotenv";
import { expand } from "dotenv-expand";
import path from "node:path";
import { z } from "zod";

expand(
  config({
    override: true,
    path: path.resolve(
      process.cwd(),
      process.env.NODE_ENV === "test" ? ".env.test" : ".env",
    ),
  }),
);

const EnvSchema = z
  .object({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(9999),
    LOG_LEVEL: z.enum([
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
      "silent",
    ]),
    REDIS_CONNECTION_URL: z.string(),

    // Console
    CONSOLE_URL: z.url().optional(),

    // HSM
    HSM_PIN: z.string().min(1),
    HSM_TOKEN_SLOT: z.coerce.number().default(1099048314),
    SOFTHSM_SO_PIN: z.string(),
    SOFTHSM_USER_PIN: z.string(),

    TREASURY_KEY_LABEL: z.string().min(18).max(1024),

    // Better stack
    BETTER_STACK_TOKEN_ID: z.string().optional(),
    BETTER_STACK_INGESTION_HOST: z.string().optional(),

    // RPC and bundlers
    ZERODEV_PROJECT_ID: z.string(),
    PIMLICO_API_KEY: z.string(),
  })
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === "production" && !input.REDIS_CONNECTION_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: "string",
        received: "undefined",
        path: ["REDIS_CONNECTION_URL"],
        message: "Must be set when NODE_ENV is 'production'",
      });
    }
  });

export type env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line ts/no-redeclare
const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export default env!;
