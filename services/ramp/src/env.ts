/* eslint-disable node/no-process-env */
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

    DATABASE_URL: z.string().url(),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    ORG_DATABASE_AUTH_TOKEN: z.string(),
    TURSO_API_TOKEN: z.string(),
    TURSO_ORGANIZATION: z.string(),
    TURSO_API_URL: z.string().url().optional(),
    // Console
    CONSOLE_URL: z.url().optional(),

    TREASURY_KEY_LABEL: z.string().min(6).max(1024),
    PALMPAY_API_URL: z.string().optional(),
    PALMPAY_APP_ID: z.string(),
    PALMPAY_PK: z.string(),
    PALMPAY_MERCHANT_ID: z.string(),
    PALMPAY_MERCHANT_PK: z.string(),
    PALMPAY_MERCHANT_SK: z.string(),

    // Better stack
    BETTER_STACK_TOKEN_ID: z.string().optional(),
    BETTER_STACK_INGESTION_HOST: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === "production" && !input.DATABASE_AUTH_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: "string",
        received: "undefined",
        path: ["DATABASE_AUTH_TOKEN"],
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
