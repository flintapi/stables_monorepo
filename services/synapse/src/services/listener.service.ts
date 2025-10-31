/**
 * Listener service defines functions for queue workers to use in creating new listeners and managing them
 */

import { EventServiceJob } from "@flintapi/shared/Queue";
import { ListenerConfig } from "../lib/types";
import EventListenerManager from "../managers/ERC20Event.manager";
import Factory from "../listener.factory";
import { QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { type BetterFetch, createFetch } from "@better-fetch/fetch";

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
    this.manager = EventListenerManager.getInstance(client);
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
    data: EventServiceJob,
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
    } = data;
    let newListenerConfig: Omit<ListenerConfig, "id">;
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
      const listenerId = await this.manager.createListener(
        {
          id: this.generateEventId(eventName),
          ...newListenerConfig,
          onStart: async () => {
            console.log("Listener starting...");
          },
        },
        rampData?.organizationId,
        rampData?.transactionId,
      );
      return { listenerId };
    }

    throw new Error("Unsupported event name");
  }

  async CreateOnRampListener(
    data: EventServiceJob,
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
    } = data;
    let newListenerConfig: Omit<ListenerConfig, "id">;
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
      const listenerId = await this.manager.createListener({
        id: this.generateEventId(eventName),
        ...newListenerConfig,
        onStart: async () => {
          console.log("Listener starting...");
        },
      });
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
    organizationId?: string,
    transactionId?: string,
  ) {
    return async (event: any) => {
      console.log("Event received:", event);

      // TODO: call webhook queue with organizationData as job data
      const { data, error } = await this.fetch(callbackUrl, {
        method: "POST",
        body: {
          organizationId,
          transactionId,
          event: JSON.stringify(event, (k, v) =>
            typeof v === "bigint" ? v.toString() : v,
          ),
          type,
        },
      });

      if (error) {
        console.log("Callback error", error);
      }
      console.log("Callback response data", data);
    };
  }
}
