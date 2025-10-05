/**
 * Listener service defines functions for queue workers to use in creating new listeners and managing them
 */

import { ListenerConfig } from "../lib/types";
import EventListenerManager from "../managers/ERC20Event.manager";

interface ListenerService {
  handleCreateListener(request: any): Promise<any>;
  getMetrics(listenerId?: string): Promise<any>;
  getListeners(): Promise<Array<any>>;
}

// Service API Handler
export class EventListenerService implements ListenerService {
  private manager: EventListenerManager;

  constructor(client: any) {
    this.manager = EventListenerManager.getInstance(client);
  }

  // REST endpoint handler
  async handleCreateListener(request: any): Promise<{ listenerId: string }> {
    const { eventName, filter, persistent = false, customLogic } = request;

    const config: ListenerConfig = {
      id: `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventName,
      filter,
      persistent,
      onEvent: customLogic || this.defaultEventHandler,
      onStart: async () => console.log(`Starting listener ${config.id}`),
      onStop: async () => console.log(`Stopping listener ${config.id}`)
    };

    const listenerId = await this.manager.createListener(config);
    return { listenerId };
  }

  async getMetrics(listenerId?: string): Promise<any> {

  }

  async getListeners(): Promise<Array<any>> {
    return []
  }

  private defaultEventHandler = async (event: any) => {
    // Default indexing logic
    console.log('Event received:', event);
  };
}
