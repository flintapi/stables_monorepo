import { AppRouteHandler } from "@/lib/types";
import type {
  CreateWalletRequest,
  ListWalletRequest,
  GetOneWalletRequest,
  UpdateWalletRequest,
  WalletOperationRequest,
  WalletDataRequest,
} from "./wallet.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { QueueNames, QueueInstances, bullMqBase } from "@flintapi/shared/Queue";
import { QueueEvents } from "bullmq";
import {
  OrgMetadata,
  SupportedChains,
  WalletMetadata,
  generateUniqueId,
  networkToChainidMap,
} from "@flintapi/shared/Utils";
import env from "@/env";
import { Address } from "viem";
import { wallet } from "./wallet.schema";
import { eq } from "drizzle-orm";

const walletQueue = QueueInstances[QueueNames.WALLET_QUEUE];
const walletQueueEvents = new QueueEvents(QueueNames.WALLET_QUEUE, bullMqBase);

export const create: AppRouteHandler<CreateWalletRequest> = async (c) => {
  const body = c.req.valid("json");
  const organization = c.get("organization");
  const orgDatabase = c.get("orgDatabase");
  const orgMetadata = organization.metadata as OrgMetadata;

  const keyLabel = generateUniqueId("wal_");

  try {
    const keyLabelExists = await orgDatabase.query.wallet.findFirst({
      where(fields, ops) {
        return ops.eq(fields.keyLabel, keyLabel);
      },
    });

    if (keyLabelExists) {
      // TODO: should not throw error since it is internal process
      return c.json(
        {
          status: "failed",
          message: "Wallet with this key already exists",
          data: null,
        },
        HttpStatusCodes.BAD_REQUEST,
      );
    }

    const job = await walletQueue.add(
      "get-address",
      {
        type: "eoa",
        keyLabel,
        chainId:
          body.network === "evm" && env.NODE_ENV === "development"
            ? SupportedChains.baseSepolia
            : SupportedChains.base,
      },
      {
        jobId: `wallet-create-${keyLabel}`,
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

    if (body.hasVirtualAccount) {
      // TODO: Create virtual account
      throw new Error("Could not create virtual account");
    }
    const walletMetadata = {
      linkedVirtualAccounts: [],
    } as WalletMetadata;

    // Step 3 - Store result and return address
    const [newWallet] = await orgDatabase
      .insert(wallet)
      .values({
        id: keyLabel,
        addresses: [
          { address: result.address, chain: body.network, type: "eoa" },
        ],
        primaryAddress: result.address,
        keyLabel,
        network: body.network,
        autoSwap: body.autoSwap,
        autoSweep: body.autoSweep,
        isActive: body.isActive,
        metadata: walletMetadata,
      })
      .returning();

    return c.json(
      { status: "success", message: "New wallet created!", data: newWallet },
      HttpStatusCodes.OK,
    );
  } catch (error) {
    return c.json(
      {
        status: "failed",
        data: null,
        message: "Something went wrong internally while creating wallet",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const list: AppRouteHandler<ListWalletRequest> = async (c) => {
  try {
    const query = c.req.valid("query");
    const organization = c.get("organization");
    const orgDatabase = c.get("orgDatabase");

    const wallets = await orgDatabase.query.wallet.findMany({
      limit: query.limit,
      offset: query.offset,
    });

    return c.json(
      {
        status: "success",
        message: "Retrieved all wallets successfully!",
        data: wallets,
      },
      HttpStatusCodes.OK,
    );
  } catch (error: any) {
    // Log error

    return c.json(
      {
        status: "failed",
        data: null,
        message: "Something went wrong internally while listing wallets",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getOne: AppRouteHandler<GetOneWalletRequest> = async (c) => {
  try {
    const params = c.req.valid("param");
    const organization = c.get("organization");
    const orgDatabase = c.get("orgDatabase");

    const wallet = await orgDatabase.query.wallet.findFirst({
      where(fields, ops) {
        return ops.eq(fields.id, params.walletId);
      },
    });

    if (!wallet) {
      return c.json(
        {
          status: "failed",
          message: "Wallet not found",
          data: null,
        },
        HttpStatusCodes.NOT_FOUND,
      );
    }

    return c.json(
      {
        status: "success",
        message: "Retrieved wallet",
        data: wallet,
      },
      HttpStatusCodes.OK,
    );
  } catch (error: any) {
    // Log error

    return c.json(
      {
        status: "failed",
        data: null,
        message: "Something went wrong internally while getting wallets",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const update: AppRouteHandler<UpdateWalletRequest> = async (c) => {
  try {
    const body = c.req.valid("json");
    const params = c.req.valid("param");
    const organization = c.get("organization");
    const orgDatabase = c.get("orgDatabase");

    const walletExists = await orgDatabase.query.wallet.findFirst({
      where(fields, ops) {
        return eq(fields.id, params.walletId);
      },
    });

    if (!walletExists) {
      return c.json(
        {
          status: "failed",
          data: null,
          message: "Wallet not found",
        },
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const [updatedWallet] = await orgDatabase
      .update(wallet)
      .set(body)
      .where(eq(wallet.id, params.walletId))
      .returning();

    return c.json(
      {
        status: "success",
        message: "Updated wallet",
        data: updatedWallet,
      },
      HttpStatusCodes.OK,
    );
  } catch (error: any) {
    // Log error

    return c.json(
      {
        status: "failed",
        data: null,
        message: "Something went wrong internally while updating wallet",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const operation: AppRouteHandler<WalletOperationRequest> = async (c) => {
  try {
    const body = c.req.valid("json");
    const params = c.req.valid("param");
    const organization = c.get("organization");
    const orgDatabase = c.get("orgDatabase");

    const wallet = await orgDatabase.query.wallet.findFirst({
      where(fields, ops) {
        return ops.eq(fields.id, params.walletId);
      },
    });

    if (!wallet) {
      return c.json(
        {
          status: "failed",
          data: null,
          message: "Wallet not found",
        },
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const chainId = networkToChainidMap[body.network];
    const jobData =
      params.action === "send"
        ? {
            chainId,
          }
        : {};

    const job = await walletQueue.add(
      "sign-transaction",
      {},
      {
        jobId: ``,
      },
    );
    const result = await job.waitUntilFinished(walletQueueEvents);

    // Call wallet queue to trigger send or call based on action
  } catch (error: any) {
    // Log error

    return c.json(
      {
        status: "failed",
        data: null,
        message:
          "Something went wrong internally while performing wallet operation",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const data: AppRouteHandler<WalletDataRequest> = async () => {};
