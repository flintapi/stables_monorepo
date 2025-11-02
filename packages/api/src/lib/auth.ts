import type { BetterAuthOptions, BetterAuthPlugin, Session } from "better-auth";
import { apiLogger } from "@flintapi/shared/Logger";

import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  emailOTP,
  multiSession,
  organization,
  twoFactor,
  apiKey,
} from "better-auth/plugins";

import db, { migrateDatabase, orgDb, tursoApi } from "@/db";
import { appSchema } from "@/db/schema";
import env from "@/env";

import { sendEmail } from "./email";
import { bullMqBase, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { QueueEvents } from "bullmq";
import {
  generateUniqueId,
  getWalletKeyLabel,
  orgSchema,
  SupportedChains,
  WalletMetadata,
} from "@flintapi/shared/Utils";
import { Address } from "viem";
import { eq } from "drizzle-orm";

const walletQueue = QueueInstances[QueueNames.WALLET_QUEUE];
const walletQueueEvents = new QueueEvents(QueueNames.WALLET_QUEUE, bullMqBase);

const authOptions = {
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...appSchema },
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
              return ops.eq(fields.userId, session?.userId);
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
      sendInvitationEmail: async ({
        organization,
        email,
        role,
        invitation,
        inviter,
        id,
      }) => {
        console.log(
          "sendInvitationEmail",
          organization,
          email,
          role,
          invitation,
          inviter,
          id,
        );

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
        } catch (error) {
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
            },
          };
        },
        afterCreateOrganization: async ({ organization, member, user }) => {
          console.log("afterCreateOrganization", organization, member, user);
          // TODO: Save organization dbUrl
          const tursoClient = tursoApi();

          const database = await tursoClient.databases.create(
            `${organization.slug}-tenant-db`,
            {
              group: "flintapi-tenants",
            },
          );
          apiLogger.info("New organization database", database);

          // TODO: Call migration function
          await migrateDatabase(`libsql://${database.hostname}`);

          const [updatedOrganization] = await db
            .update(appSchema.organization)
            .set({
              metadata: {
                dbUrl: `libsql://${database.hostname}`, // provissioned turso db url
              },
            })
            .where(eq(appSchema.organization.id, organization.id))
            .returning();
          // TODO: Send email
          // TODO: Create default master wallet for organization with organization virtual account
          const id = generateUniqueId("wal_");
          const keyLabel = getWalletKeyLabel(id, true);

          console.log("Custom id", id, "Key Label", keyLabel);

          try {
            const job = await walletQueue.add(
              "get-address",
              {
                type: "eoa",
                keyLabel,
                chainId: SupportedChains.base,
              },
              {
                jobId: `wallet-create-${id}`,
                attempts: 2,
                backoff: {
                  type: "exponential",
                  delay: 1000,
                },
                removeOnComplete: true,
              },
            );

            const result = (await job.waitUntilFinished(walletQueueEvents)) as {
              address: Address;
              index: number;
            };

            // Step 2 - Create virtual account and add to wallet metadata

            const walletMetadata = {
              linkedVirtualAccounts: [],
            } as WalletMetadata;

            // Get org database
            const orgDatabase = orgDb({
              dbUrl: updatedOrganization.metadata?.dbUrl!,
            });

            // Step 3 - Store result and return address
            const [newWallet] = await orgDatabase
              .insert(orgSchema.wallet)
              .values({
                id,
                addresses: [
                  { address: result.address, network: "evm", type: "eoa" },
                ],
                primaryAddress: result.address,
                keyLabel,
                network: "evm",
                hasVirtualAccount: true,
                autoSwap: false,
                autoSweep: false,
                isActive: true,
                metadata: walletMetadata,
              })
              .returning();

            apiLogger.info("Created default master wallet", newWallet);
          } catch (error) {
            console.log("error creating wallet", error);
            apiLogger.error("Failed to create default master wallet", error);
          }
        },
        beforeDeleteOrganization: async ({ organization, user }) => {
          console.log("Before deleting organization", organization, user);

          try {
            const tursoClient = tursoApi();
            const database = await tursoClient.databases.delete(
              `${organization.slug}-tenant-db`,
            );
            apiLogger.info("Organization database deleted", database);
          } catch (error) {
            apiLogger.error("Failed to delete organization database", error);
          }
        },
        beforeAcceptInvitation: async ({ invitation, organization, user }) => {
          console.log("beforeAcceptInvitation", invitation, organization, user);
        },
        afterAcceptInvitation: async ({
          invitation,
          member,
          user,
          organization,
        }) => {
          // TODO: send invitation accepted email
          console.log(
            "afterAcceptInvitation",
            invitation,
            member,
            user,
            organization,
          );
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
        beforeUpdateMemberRole: async ({
          member,
          newRole,
          user,
          organization,
        }) => {
          console.log(
            "beforeUpdateMemberRole",
            member,
            newRole,
            user,
            organization,
          );
        },
        afterUpdateMemberRole: async ({
          member,
          previousRole,
          user,
          organization,
        }) => {
          console.log(
            "afterUpdateMemberRole",
            member,
            previousRole,
            user,
            organization,
          );
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

export const auth = betterAuth({
  ...authOptions,
  plugins: [
    apiKey({
      defaultPrefix: "live_key_",
      rateLimit: {
        enabled: true,
        timeWindow: 60 * 1000,
        maxRequests: 20, // Allow 20 requests in a second
      },
      permissions: {
        defaultPermissions: {
          ramp: ["on"],
          wallets: ["on"],
          events: ["on"],
        },
      },
      enableMetadata: true,
      disableSessionForAPIKeys: true,
      apiKeyHeaders: ["x-api-key", "flint-api-key"],
    }),
    ...(authOptions.plugins as Array<BetterAuthPlugin>),
  ],
});
