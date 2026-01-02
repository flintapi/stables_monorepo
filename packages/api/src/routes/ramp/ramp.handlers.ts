import { AppRouteHandler } from "@/lib/types";
import type {
  RampRequest,
  BankListRequest,
  TransactionRequest,
  NameQueryRequest,
} from "./ramp.routes";
import { transaction as transactionSchema } from "./ramp.schema";
import {
  OnbrailsAdapter,
  BellbankAdapter,
  FiatPaymentContext,
  PaymentProvider,
} from "@flintapi/shared/Adapters";
import { networkToChainidMap, TOKEN_ADDRESSES } from "@flintapi/shared/Utils";
import * as HttpStatusCodes from "stoker/http-status-codes";
import env from "@/env";
import { QueueInstances, QueueNames, bullMqBase } from "@flintapi/shared/Queue";
import { ResponseStatus } from "@/lib/types";
import { QueueEvents } from "bullmq";
import { Address } from "viem";
import {
  cacheVirtualAccount,
  getDefaultVirtualAccountArgs,
} from "./ramp.utils";
import { apiLogger } from "@flintapi/shared/Logger";

const kmsQueue = QueueInstances[QueueNames.WALLET_QUEUE];
const kmsQueueEvents = new QueueEvents(QueueNames.WALLET_QUEUE, bullMqBase);
const eventQueue = QueueInstances[QueueNames.EVENT_QUEUE];
const eventQueueEvents = new QueueEvents(QueueNames.EVENT_QUEUE, bullMqBase);

export const ramp: AppRouteHandler<RampRequest> = async (c) => {
  try {
    const body = c.req.valid("json");
    const orgDatabase = c.get("orgDatabase");
    const organization = c.get("organization");
    const webhookUrl = c.get('webhookUrl');
    const webhookSecret = c.get('webhookSecret');
    apiLogger.info("Ramp transaction genesis...", body);

    switch (body.type) {
      case "off": {
        const { amount, reference, network, destination } = body;

        const chainId = networkToChainidMap[network];
        // TODO: Add job to queue
        const getAddressJob = await kmsQueue.add(
          "get-address",
          {
            chainId,
            type: "smart",
            keyLabel: env.TREASURY_KEY_LABEL,
          },
          {
            jobId: `kms-get-address-${chainId}-${c.get("requestId")}`,
          },
        );

        // TODO: Get deposit address
        const result = (await getAddressJob.waitUntilFinished(
          kmsQueueEvents,
        )) as { address: Address; index: number };

        apiLogger.info("Deposit address created", result);
        const [newTransaction] = await orgDatabase
          .insert(transactionSchema)
          .values({
            type: "off-ramp",
            status: "pending",
            network,
            reference,
            amount,
            metadata: {
              isDestinationExternal: true,
              bankCode: destination.bankCode,
              accountNumber: destination.accountNumber,
              depositAddress: result.address,
              index: result.index, // update from kms service get-address
              notifyUrl: body?.notifyUrl || webhookUrl,
              webhookSecret,
            } as any,
          })
          .returning();

        // Add job to event queue
        const tokenAddress = TOKEN_ADDRESSES[chainId].cngn.address as Address;
        const eventJob = await eventQueue.add(
          "Transfer",
          {
            chainId,
            eventName: "Transfer",
            eventArgType: "to",
            address: result.address,
            tokenAddress,
            persist: false,
            callbackUrl: `${env.API_URL}/webhooks/synapse/offramp`, // callback when event received
            rampData: {
              type: "off",
              organizationId: organization.id,
              transactionId: newTransaction.id,
            },
          },
          {
            jobId: `event-Transfer-${chainId}-cngn-${c.get("requestId")}`,
            attempts: 2,
          },
        );
        const listenerResult = await eventJob.waitUntilFinished(
          eventQueueEvents,
        );
        apiLogger.info(`Listener created...`, listenerResult)

        return c.json(
          {
            status: "success",
            message: "Off ramp transaction initiated",
            data: {
              type: "off-ramp",
              status: "pending",
              transactionId: newTransaction.id,
              depositAddress: result.address,
            },
          },
          HttpStatusCodes.OK,
        );
      }
      case "on": {
        const { amount, reference, network, destination } = body;

        const bankAdapter = new OnbrailsAdapter();

        const bankCode = bankAdapter.bankCode;
        const { accountNumber, accountName, bankName } =
          await bankAdapter.createVirtualAccount();

        apiLogger.info("On ramp bank details:", {
          accountNumber,
          accountName,
          bankCode,
          bankName
        });

        // TODO: Create transaction data
        // TODO: Add to transaction db, with transaction metadata
        const [newTransaction] = await orgDatabase
          .insert(transactionSchema)
          .values({
            type: "on-ramp",
            status: "pending",
            network,
            reference,
            amount,
            metadata: {
              isDestinationExternal: true,
              address: destination.address,
              collectionBankCode: bankCode,
              collectionAccountNumber: accountNumber,
              collectionBankName: bankName ?? "Bellbank MFB",
              notifyUrl: body?.notifyUrl || webhookUrl,
              webhookSecret,
            },
          })
          .returning();

        // Cache virtual account to be recoverable from a deposit webhook
        await cacheVirtualAccount(accountNumber, {
          organizationId: organization.id,
          transactionId: newTransaction.id,
        });

        return c.json(
          {
            status: "success",
            message: "On ramp transaction initiated",
            data: {
              type: "on",
              status: "pending",
              transactionId: newTransaction.id,
              depositAccount: {
                accountNumber,
                accountName,
                bankCode,
                bankName,
              },
            },
          },
          HttpStatusCodes.OK,
        );
      }
    }
  }
  catch (error: any) {
    apiLogger.error("Failed to initialize ramp transaction", {error});
    console.log("Failed to initialize ramp transaction:", error);
    return c.json({
      status: 'failed',
      message: "Failed to initialize ramp transaction",
      data: null
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const banks: AppRouteHandler<BankListRequest> = async (c) => {
  try {
    const provider = PaymentProvider.PALMPAY;

    const paymentContext = new FiatPaymentContext(provider);

    const banks = await paymentContext.listBanks();

    return c.json(
      {
        status: "success" as ResponseStatus,
        message: "Bank list",
        data: banks || [
          {
            institutionName: "BellBank",
            institutionCode: "123456",
          },
        ],
      },
      HttpStatusCodes.OK,
    );
  } catch (error: any) {
    // Log error
    return c.json(
      {
        status: "failed" as ResponseStatus,
        message: "Failed to fetch banks",
        data: null,
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const nameQuery: AppRouteHandler<NameQueryRequest> = async (c) => {
  try {
    const query = c.req.valid("query")
    const provider = PaymentProvider.PALMPAY;

    const paymentContext = new FiatPaymentContext(provider);

    const accountName = await paymentContext.nameEnquiry({
      bankCode: query.bankCode,
      accountNumber: query.accountNumber,
    });

    return c.json(
      {
        status: "success" as ResponseStatus,
        message: "Bank name query",
        data: {
          accountName: accountName,
          accountNumber: query.accountNumber,
          bankCode: query.bankCode
        }
      },
      HttpStatusCodes.OK,
    );
  }
  catch(error: any) {
    apiLogger.error(`Failed to get account name: ${error.message}`, error)
    return c.json(
      {
        status: "failed" as ResponseStatus,
        message: "Failed to get account name",
        data: null,
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}

export const transaction: AppRouteHandler<TransactionRequest> = async (c) => {
  try {
    const query = c.req.valid("query");
    const orgDatabase = c.get("orgDatabase");

    console.log("Query", query);

    if (query.id || query.reference) {
      const transaction = await orgDatabase.query.transactions.findFirst({
        where(fields, ops) {
          return ops.or(
            ops.eq(fields.id, query.id),
            ops.eq(fields.reference, query.reference),
          );
        },
      });

      if (!transaction) {
        return c.json(
          {
            status: "failed" as ResponseStatus,
            message: "Transaction not found",
            data: null,
          },
          HttpStatusCodes.NOT_FOUND,
        );
      }

      return c.json(
        {
          status: "success" as ResponseStatus,
          message: "Transaction details",
          data: {...transaction, metadata: null},
        },
        HttpStatusCodes.OK,
      );
    }

    const transactions = await orgDatabase.query.transactions.findMany();
    return c.json(
      {
        status: "success" as ResponseStatus,
        message: "Transaction details",
        data: transactions.map((trx) => ({
          ...trx,
          metadata: null
        })),
      },
      HttpStatusCodes.OK,
    );
  } catch (error: any) {
    // Log error
    return c.json(
      {
        status: "failed" as ResponseStatus,
        message: "Failed to get transaction",
        data: null,
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
