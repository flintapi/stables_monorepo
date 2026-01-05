/**
 * Listener service defines functions for queue workers to use in creating new listeners and managing them
 */

import { EventServiceJob } from "@flintapi/shared/Queue";
import { ListenerConfig } from "../lib/types";
import EventListenerManager from "../managers/ERC20Event.manager";
import Factory from "../listener.factory";
import { type BetterFetch, createFetch } from "@better-fetch/fetch";
import { formatUnits, Log, parseAbi, ParseEventLogsReturnType } from "viem";
import { ChainId, TOKEN_ADDRESSES } from "@flintapi/shared/Utils";
import { createListenerCache } from "@/lib/cache.listener";
import crypto from "node:crypto"
import env from "@/env";
import { eventLogger } from "@flintapi/shared/Logger";

interface ListenerService {
  CreateOfframpListener(request: EventServiceJob): Promise<any>;
  CreateOnRampListener(request: EventServiceJob): Promise<any>;
  GetMetrics(listenerId?: string): Promise<any>;
  GetListeners(): Promise<Array<any>>;
}

// Service API Handler
export default class EventListenerService implements ListenerService {
  private manager: EventListenerManager;
  private fetch: BetterFetch;

  constructor(client: any) {
    this.manager = new EventListenerManager(client); // this can't be a singleton
    this.fetch = createFetch({
      timeout: 10000 * 3,
      retry: {
        type: "exponential",
        attempts: 5,
        maxDelay: 1000,
        baseDelay: 1000,
        shouldRetry: (response) => {
          // Retry if status is not 200
          return response?.status !== 200;
        },
      },
      onRetry: (response) => {
        console.log("Push retried for URL:::", response.response.status);
        // TODO: Collect log
      },
    });
  }

  // REST endpoint handler
  async CreateOfframpListener(
    data: EventServiceJob & {fromBlock: bigint},
    restoreId?: string,
  ): Promise<{ listenerId: string }> {
    const {
      eventName,
      tokenAddress,
      persist = false,
      address,
      eventArgType,
      chainId,
      rampData,
      callbackUrl,
      fromBlock
    } = data;
    let newListenerConfig: Omit<ListenerConfig, "id" | "fromBlock">;
    if (eventName === "Transfer") {
      newListenerConfig = Factory.createERC20TransferListener(
        tokenAddress,
        {
          [eventArgType]: address,
        },
        persist,
        chainId,
        rampData
          ? this.getDefaultTransferEventHandler(
              callbackUrl,
              rampData?.type,
              chainId as ChainId,
              rampData?.organizationId,
              rampData?.transactionId,
            )
          : async (event) => {
              console.log(
                "Custom event handler to ERC20 transfer factory function",
                event,
              );
            },
      );
      const timeout = 5 * 60_000; // in miliseconds
      const listenerId = await this.manager.createListener(
        {
          id: restoreId ?? this.generateEventId(eventName),
          ...newListenerConfig,
          fromBlock,
          timeout: persist ? (Date.now() + timeout) : undefined,
          onStart: async () => {
            console.log("Listener starting...");
          },
        },
        rampData?.organizationId,
        rampData?.transactionId,
      );
      const cache = await createListenerCache();
      await cache.storeListener(listenerId, {...data, rampData: JSON.stringify(rampData)})
      return { listenerId };
    }

    throw new Error("Unsupported event name");
  }

  async CreateOnRampListener(
    data: EventServiceJob & {fromBlock: bigint},
    restoreId?: string,
  ): Promise<{ listenerId: string }> {
    const {
      eventName,
      tokenAddress,
      persist = false,
      address,
      eventArgType,
      chainId,
      rampData,
      callbackUrl,
      fromBlock,
    } = data;
    let newListenerConfig: Omit<ListenerConfig, "id" | "fromBlock">;
    if (eventName === "Transfer") {
      newListenerConfig = Factory.createERC20TransferListener(
        tokenAddress,
        {
          [eventArgType]: address,
        },
        persist,
        chainId,
        rampData
          ? this.getDefaultTransferEventHandler(
              callbackUrl,
              rampData?.type,
              chainId as ChainId,
              rampData?.organizationId,
              rampData?.transactionId,
            )
          : async (event) => {
              console.log(
                "Custom event handler to ERC20 transfer factory function",
                event,
              );
            },
      );
      const timeout = 5 * 60_000; // in miliseconds
      const listenerId = await this.manager.createListener({
        id: restoreId ?? this.generateEventId(eventName),
        ...newListenerConfig,
        fromBlock,
        timeout: persist ? (Date.now() + timeout) : undefined,
        onStart: async () => {
          console.log("Listener starting...");
        },
      });
      const cache = await createListenerCache();
      await cache.storeListener(listenerId, {...data, rampData: JSON.stringify(rampData)})
      return { listenerId };
    }

    throw new Error("Unsupported event name");
  }

  async GetMetrics(listenerId?: string): Promise<any> {}

  async GetListeners(): Promise<Array<any>> {
    return [];
  }

  private generateEventId(eventName: string): string {
    const random = crypto
      .randomUUID()
      .replace(/-/g, "")
      .substring(eventName.length);

    return `${eventName.toLowerCase()}_${random}`;
  }

  private getDefaultTransferEventHandler(
    callbackUrl: string,
    type: "off" | "on",
    chainId: ChainId,
    organizationId?: string,
    transactionId?: string,
  ) {
    return async (event: ParseEventLogsReturnType<ReturnType<typeof parseAbi>, ["Transfer"]>[0]) => {
      const payload = {
        organizationId,
        transactionId,
        transactionHash: event?.transactionHash,
        amountReceived: formatUnits((event.args as { value: bigint })?.value, TOKEN_ADDRESSES[chainId].cngn.decimal),
        type
      };
      const { data, error } = await this.fetch(callbackUrl, {
        method: "POST",
        headers: {
          "x-signature": this.signPayload(payload)
        },
        body: payload,
      });

      if (error) {
        eventLogger.error("Callback error", error);
      }
      eventLogger.info("Callback response data", JSON.stringify(data, null, 3));
    };
  }

  private signPayload(payload: any): string {
    const stringifyPayload = JSON.stringify(payload).trim();
    console.log("Stringy payload", stringifyPayload)
    return crypto.createHmac("sha512", Buffer.from(env.SYNAPSE_WH_KEY, 'utf8')).update(Buffer.from(stringifyPayload, 'utf8')).digest("hex");
  }
}
