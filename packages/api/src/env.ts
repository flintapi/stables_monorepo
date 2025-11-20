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
    MQ_ADMIN_USERNAME: z.string(),
    MQ_ADMIN_PASSWORD: z.string(),
    API_URL: z.url(),
    API_GATEWAY_URL: z.url(),
    DATABASE_URL: z.url(),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    ORG_DATABASE_AUTH_TOKEN: z.string(),
    TURSO_API_TOKEN: z.string(),
    TURSO_API_URL: z.string().url().optional(),
    TURSO_ORGANIZATION: z.string().optional(),

    // Auth providers
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Email provider
    PLUNK_API_URL: z.url().optional(),
    PLUNK_API_KEY: z.string().min(1).optional(),

    // Console
    CONSOLE_URL: z.url().optional(),

    // HSM
    // HSM_PIN: z.string().min(1),
    // HSM_TOKEN_SLOT: z.coerce.number().default(1099048314),

    TREASURY_KEY_LABEL: z.string().min(1).max(1024),
    TREASURY_EVM_ADDRESS: z.string().startsWith('0x').default('0x6480d80d340d57ad82A7E79A91F0EceC3869D479'),

    PALMPAY_API_URL: z.string().url(),
    PALMPAY_APP_ID: z.string(),
    PALMPAY_PK: z.string(),
    PALMPAY_MERCHANT_ID: z.string(),
    PALMPAY_MERCHANT_PK: z.string(),
    PALMPAY_MERCHANT_SK: z.string(),

    // Centiiv
    CENTIIV_API_KEY: z.string().min(1).optional(),
    CENTIIV_WH_SECRET_KEY: z.string().min(1).optional(),
    CENTIIV_API_URL: z.url().optional(),
    CENTIIV_WH_URL: z.url().optional(),

    // Better stack
    BETTER_STACK_TOKEN_ID: z.string().optional(),
    BETTER_STACK_INGESTION_HOST: z.string().optional(),

    // MQ Board
    JWT_SECRET: z.string(),
    BOARD_EMAIL: z.string(),
    BOARD_PHASH: z.string(),
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
