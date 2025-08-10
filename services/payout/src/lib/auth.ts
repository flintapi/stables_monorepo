import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, emailOTP } from "better-auth/plugins";

import db from "@/db";
import * as appSchema from "@/db/app-schema";
import * as authSchema from "@/db/auth-schema";
import env from "@/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...appSchema, ...authSchema },
  }),
  emailAndPassword: {
    disableSignUp: true,
    enabled: false,
  },
  plugins: [
    apiKey({
      defaultPrefix: `sk_live_`,
      rateLimit: {
        enabled: false,
      },
      apiKeyHeaders: ["x-api-key", "flint-api-key"],
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Implement the sendVerificationOTP method to send the OTP to the user's email address

        console.log(otp, email, type);
      },
    }),
  ],
});
