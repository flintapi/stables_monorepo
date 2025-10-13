/**
 * Listener service defines functions for queue workers to use in creating new listeners and managing them
 */

import { EventServiceJob } from "@flintapi/shared/Queue"
import { ListenerConfig } from "../lib/types";
import EventListenerManager from "../managers/ERC20Event.manager";
import Factory from "../listener.factory";
import { QueueInstances, QueueNames } from "@flintapi/shared/Queue"

interface ListenerService {
  CreateOfframpListener(request: EventServiceJob): Promise<any>;
  CreateOnRampListener(request: EventServiceJob): Promise<any>;
  GetMetrics(listenerId?: string): Promise<any>;
  GetListeners(): Promise<Array<any>>;
}

// Service API Handler
export default class EventListenerService implements ListenerService {
  private manager: EventListenerManager;

  constructor(client: any) {
    this.manager = EventListenerManager.getInstance(client);
  }

  // REST endpoint handler
  async CreateOfframpListener(data: EventServiceJob): Promise<{ listenerId: string }> {
    const { eventName, tokenAddress, persist = false, address, eventArgType, chainId, rampData } = data;
    let newListenerConfig: Omit<ListenerConfig, 'id'>;
    if(eventName === "Transfer") {
      newListenerConfig = Factory.createERC20TransferListener(
        tokenAddress,
        {
          [eventArgType]: address
        },
        persist,
        chainId,
        (rampData? this.getDefaultTransferEventHandler(
          rampData?.type,
          rampData?.organizationData,
          rampData?.transactionData
        ) : async (event) => {
          console.log("Custom event handler to ERC20 transfer factory function", event)
        })
      )
      const listenerId = await this.manager.createListener({
        id: this.generateEventId(eventName),
        ...newListenerConfig,
        onStart: async () => {
          console.log("Listener starting...")
        }
      });
      return { listenerId };
    }

    throw new Error('Unsupported event name')
  }

  async CreateOnRampListener(data: EventServiceJob): Promise<any> {
    const { eventName, tokenAddress, persist = false, address, eventArgType, chainId, rampData } = data;
    let newListenerConfig: Omit<ListenerConfig, 'id'>;
    if(eventName === "Transfer") {
      newListenerConfig = Factory.createERC20TransferListener(
        tokenAddress,
        {
          [eventArgType]: address
        },
        persist,
        chainId,
        (rampData? this.getDefaultTransferEventHandler(
          rampData?.type,
          rampData?.organizationData,
          rampData?.transactionData
        ) : async (event) => {
          console.log("Custom event handler to ERC20 transfer factory function", event)
        })
      )
      const listenerId = await this.manager.createListener({
        id: this.generateEventId(eventName),
        ...newListenerConfig,
        onStart: async () => {
          console.log("Listener starting...")
        }
      });
      return { listenerId };
    }
  }

  async GetMetrics(listenerId?: string): Promise<any> {

  }

  async GetListeners(): Promise<Array<any>> {
    return []
  }

  private generateEventId(eventName: string): string {
    const random = crypto.randomUUID().replace(/-/g, "").substring(eventName.length);

    return `${eventName.toLowerCase()}_${random}`;
  }

  private getDefaultTransferEventHandler(type: "off" | "on", organizationData?: any, transactionData?: any) {
    return async (event: any) => {
      console.log('Event received:', event);

      // Default payout trigger logic
      const rampQueue = QueueInstances[QueueNames.RAMP_QUEUE];
      await rampQueue.add(type === "off"? "off-ramp" : "on-ramp", {
        type,
        organizationData,
        transactionData
      }, {
        attempts: 3,
        jobId: `off-ramp:${transactionData?.id || crypto.randomUUID()}`
      });

      // TODO: call webhook queue with organizationData as job data
      // TODO: call wallet service to trigger transfer to treasury
    };
  }
}
