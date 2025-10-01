import type { BetterAuthOptions, Session } from "better-auth";

import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, multiSession, organization, twoFactor } from "better-auth/plugins";

import db from "@/db";
import * as schema from "@/db/schema";
import env from "@/env";

import { sendEmail } from "./email";

const authOptions = {
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...schema },
  }),
  databaseHooks: {
    session: {
      update: {
        after: async (session) => {
          console.log("Update after session", session);
        },
      },
      create: {
        after: async (session) => {
          console.log("Create After session", session);
        },
        before: async (session: Session) => {
          console.log("Create before session", session);
          const organizations = await db.query.member.findMany({
            where(fields, ops) {
              return ops.eq(
                fields.userId,
                session?.userId,
              );
            },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: organizations[0]?.organizationId,
            },
          };
        },
      },
    },
  },
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
    organization({
      creatorRole: "owner",
      cancelPendingInvitationsOnReInvite: true,
      sendInvitationEmail: async ({ organization, email, role, invitation, inviter, id }) => {
        console.log("sendInvitationEmail", organization, email, role, invitation, inviter, id);

        const consoleUrl = env.CONSOLE_URL;
        const inviteLink = `${consoleUrl}/invite/${invitation.id}`;

        try {
          await sendEmail({
            subject: "Invitation to join organization",
            body: `
              You have been invited to join the organization ${organization.name}.
              <br/>Please click or copy the link below to accept the invitation:
              <br/><a href="${inviteLink}">${inviteLink}</a>`,
            to: email,
          });
        }
        catch (error) {
          console.log("Error sending email", error);
          throw new APIError("INTERNAL_SERVER_ERROR", {
            message: "Failed to send Invitation email",
          });
        }
      },
      organizationHooks: {
        beforeCreateOrganization: async ({ organization, user }) => {
          // TODO: track organization slug already exists and throw APIError
          console.log("beforeCreateOrganization", organization, user);

          return {
            data: {
              ...organization,
              metadata: {
                databaseUrl: "", // provissioned turso db url
              },
            },
          };
        },
        afterCreateOrganization: async ({ organization, member, user }) => {
          // TODO: Send email
          // TODO: Provision turso/sqlite db for organization
          console.log("afterCreateOrganization", organization, member, user);
        },
        beforeAcceptInvitation: async ({ invitation, organization, user }) => {
          console.log("beforeAcceptInvitation", invitation, organization, user);
        },
        afterAcceptInvitation: async ({ invitation, member, user, organization }) => {
          console.log("afterAcceptInvitation", invitation, member, user, organization);
        },
        beforeAddMember: async ({ member, user, organization }) => {
          console.log("beforeAddMember", member, user, organization);
        },
        afterAddMember: async ({ member, user, organization }) => {
          console.log("afterAddMember", member, user, organization);
        },
        afterRemoveMember: async ({ member, user, organization }) => {
          console.log("afterRemoveMember", member, user, organization);
        },
        beforeUpdateMemberRole: async ({ member, newRole, user, organization }) => {
          console.log("beforeUpdateMemberRole", member, newRole, user, organization);
        },
        afterUpdateMemberRole: async ({ member, previousRole, user, organization }) => {
          console.log("afterUpdateMemberRole", member, previousRole, user, organization);
        },
      },
    }),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
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
