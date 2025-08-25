import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, emailOTP } from "better-auth/plugins";

import db from "@/db";
import * as appSchema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth-schema";
import env from "@/env";

import { sendEmail } from "./email";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
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
      enableMetadata: true,
      apiKeyHeaders: ["x-api-key", "flint-api-key"],
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Implement the sendVerificationOTP method to send the OTP to the user's email address

        if (type === "sign-in") {
          await sendEmail({
            to: email,
            subject: "Sign-in Verification",
            body: `Your verification code is ${otp}.`,
            name: "Flint API",
          });
        }

        console.log(otp, email, type);
      },
    }),
  ],
  advanced: {
    
  },
  trustedOrigins: ['*']
});
