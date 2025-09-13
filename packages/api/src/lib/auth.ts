import type { BetterAuthOptions } from "better-auth";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, multiSession, twoFactor } from "better-auth/plugins";

import db from "@/db";
import * as schema from "@/db/schema";
import env from "@/env";

import { sendEmail } from "./email";

const authOptions = {
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...schema },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      enabled: true,
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      redirectURI: "http://localhost:9999/api/auth/callback/github",
    },
    google: {
      enabled: false,
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        // Implement your email sending logic here

        switch (type) {
          case "sign-in": {
            await sendEmail({
              to: email,
              subject: "Welcome to Flint",
              body: `Your account has just been accessed if this was you. No further action is required.`,
            });
            break;
          }
          case "email-verification": {
            await sendEmail({
              to: email,
              subject: "Verify your email",
              body: `Verify your email with the OTP: <b>${otp}</b>`,
            });
            break;
          }
          case "forget-password": {
            await sendEmail({
              to: email,
              subject: "Reset your password",
              body: `Reset your password with the OTP: <b>${otp}</b>`,
            });
            break;
          }
        }
      },
    }),
    multiSession(),
    twoFactor(),
  ],
  trustedOrigins: ["*", "http://localhost:3000", "console.flintapi.io"], // TODO: update to fetch check IP and run allowed IPs
  advanced: {
    cookiePrefix: `flint_sesh_`,
  },
} as BetterAuthOptions;

export const auth = betterAuth(authOptions);
