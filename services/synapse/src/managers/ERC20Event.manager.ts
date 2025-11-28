import { pipeline } from "stream/promises";
import { EventProcessor } from "../processors/event.processor";
// import { MetricsCollector } from "../processors/metrics.processor";
// import { DatabaseWriter } from "@/processors/database.processor";
import { ListenerConfig, ListenerState } from "../lib/types";
import {
  PublicClient,
} from "viem";
import { createListenerCache } from "@/lib/cache.listener";
import { EthStream } from "@/streams/eth.stream";
import { ChainId } from "@flintapi/shared/Utils";

/**
 * EventStream → EventProcessor → (optional: database writer, logger, etc.)
 *   ↓              ↓
 * Raw events → Process with → Transformed output
 * from viem    your logic
 */

// Singleton pattern for Manager Class
export default class EventListenerManager {
  private static instance: EventListenerManager;
  private listeners = new Map<string, ListenerState>();
  private client: PublicClient; // viem client
  private persistentStore: Map<string, ListenerConfig> = new Map(); // This can be swapped with redis cache

  constructor(client: PublicClient) {
    this.client = client;
    // this.restorePersistentListeners();
  }

  // Singleton won't work for our new setup with multiple listeners
  static getInstance(client: PublicClient): EventListenerManager {
    if (!EventListenerManager.instance) {
      EventListenerManager.instance = new EventListenerManager(client);
    }
    return EventListenerManager.instance;
  }

  // Template Method Pattern for lifecycle management
  async createListener(
    config: ListenerConfig,
    organizationId?: string,
    transactionId?: string,
  ): Promise<string> {
    if (this.listeners.has(config.id)) {
      throw new Error(`Listener ${config.id} already exists`);
    }

    // Pre-start hook
    await config.onStart?.();

    // Create event stream with backpressure handling
    // const eventStream = new EventStream(config);
    const ethStream = new EthStream(this.client, config.chainId as ChainId, config)
    const eventProcessor = new EventProcessor(config, config.id);
    // TODO: Bring in database processor
    // const metricsCollector = new MetricsCollector(config, config.id);
    // const databaseWriter = new DatabaseWriter(
    //   { ...config, organizationId, transactionId },
    //   config.id,
    // );

    // Handle stream events
    ethStream.on("data", (chunk) => {
      console.warn(`Data still comming through for ${config.id}`);
      console.log("Data", chunk)
    });

    ethStream.on("end", () => {
      console.log(`Eth stream ended for ${config.id}`);
    });

    ethStream.on("close", () => {
      console.log(`Eth stream closed for ${config.id}`);
    });

    // databaseWriter.once("error", (err) => {
    //   console.log("Error in database writer", err);
    // });

    eventProcessor.on("shutdown", (id: string) => {
      console.log(`Shutdown event emitted: listener ID: ${id}`);

      this.stopListener(id);
    });

    // Start processing pipeline
    this.startEventPipeline(ethStream, eventProcessor);

    // Create viem watcher with backpressure awareness
    console.log(config.filter, ":::Filter for event");

    const state: ListenerState = {
      id: config.id,
      config,
      status: "active",
      eventStream: ethStream,
    };

    console.log("Setting config for listener", config.id)
    this.listeners.set(config.id, state);

    // Store persistent listeners for restart capability
    if (config.persistent) {
      this.persistentStore.set(config.id, config);
    }

    return config.id;
  }

  private async startEventPipeline(
    eventStream: EthStream,
    eventProcessor: EventProcessor,
    // metricsCollector?: DatabaseWriter,
  ) {
    try {
      await pipeline(eventStream, eventProcessor);
    } catch (error) {
      console.error("Event processing pipeline error:", error);
    }
  }

  async stopListener(id: string): Promise<void> {
    const listener = this.listeners.get(id);
    if (!listener) return;

    // Pre-stop hook
    await listener.config.onStop?.();

    // Close stream first
    if (listener.eventStream && !listener.eventStream.destroyed) {
      console.log("Stream will auto close...", listener.eventStream.destroyed);
      listener.eventStream.destroy();
    }

    listener.status = "stopped";
    this.listeners.delete(id);

    console.log("Listener after destroyed and stopped", listener.status, JSON.stringify(listener.config, (k,v) => typeof v === 'bigint'? v.toString() : v, 3))

    // Remove from persistent store if not persistent
    if (!listener.config.persistent) {
      console.log("Clearing cache....")
      const cache = await createListenerCache();
      await cache.deleteListener(id);
    }
  }

  // Restart all persistent listeners (for server recovery)
  private async restorePersistentListeners(): Promise<void> {
    for (const [id, config] of this.persistentStore) {
      try {
        await this.createListener(config);
      } catch (error) {
        console.error(`Failed to restore listener ${id}:`, error);
      }
    }
  }

  async shutdown(): Promise<void> {
    const stopPromises = Array.from(this.listeners.keys()).map((id) =>
      this.stopListener(id),
    );
    await Promise.all(stopPromises);
  }
}
