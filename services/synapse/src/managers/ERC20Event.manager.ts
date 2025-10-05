import { pipeline } from 'stream/promises';
import { EventStream } from "../steams/event.stream";
import { EventProcessor } from '../processors/event.processor';
import { ListenerConfig, ListenerState } from '../lib/types';
import { MetricsCollector } from '../processors/metrics.processor';
import { Log, parseAbi, parseAbiItem, PublicClient } from 'viem';

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

  private constructor(client: PublicClient) {
    this.client = client;
    this.restorePersistentListeners();
  }

  static getInstance(client?: any): EventListenerManager {
    if (!EventListenerManager.instance) {
      EventListenerManager.instance = new EventListenerManager(client);
    }
    return EventListenerManager.instance;
  }

  // Template Method Pattern for lifecycle management
  async createListener(config: ListenerConfig): Promise<string> {
    if (this.listeners.has(config.id)) {
      throw new Error(`Listener ${config.id} already exists`);
    }

    // Pre-start hook
    await config.onStart?.();

    // Create event stream with backpressure handling
    const eventStream = new EventStream(config);
    const eventProcessor = new EventProcessor(config, config.id);
    const metricsCollector = new MetricsCollector()

    // Handle stream events
    eventStream.on('pause-watcher', () => {
      console.warn(`Pausing watcher for ${config.id} due to backpressure`);
    });

    eventStream.on('resume-watcher', () => {
      console.log(`Resuming watcher for ${config.id}`);
    });

    eventProcessor.on('shutdown', (listenerId) => {
      this.stopListener(listenerId);
    });

    // Start processing pipeline
    this.startEventPipeline(
      eventStream,
      eventProcessor,
      metricsCollector
    );

    // Create viem watcher with backpressure awareness
    const unwatch = this.client.watchEvent({
      ...config.filter,
      events: parseAbi([
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed sender, uint256 value)"
      ]),
      batch: false,
      onLogs: (logs: Log[]) => {
        for (const log of logs) {
          const success = eventStream.addEvent(log);
          if (!success && !eventStream.isPaused()) {
            console.warn(`Buffer full for listener ${config.id}, dropping event`);
          }
        }
      },
    });

    const state: ListenerState = {
      id: config.id,
      unwatch,
      config,
      status: 'active',
      eventStream
    };

    this.listeners.set(config.id, state);

    // Store persistent listeners for restart capability
    if (config.persistent) {
      this.persistentStore.set(config.id, config);
    }

    return config.id;
  }

  private async startEventPipeline(eventStream: EventStream, eventProcessor: EventProcessor, metricsCollector: MetricsCollector) {
    try {
      await pipeline(
        eventStream,
        eventProcessor,
        metricsCollector
      );
    } catch (error) {
      console.error('Event processing pipeline error:', error);
    }
  }

  async stopListener(id: string): Promise<void> {
    const listener = this.listeners.get(id);
    if (!listener) return;

    // Pre-stop hook
    await listener.config.onStop?.();

    // Close stream first
    if (listener.eventStream && !listener.eventStream.destroyed) {
      listener.eventStream.destroy();
    }

    listener.unwatch();
    listener.status = 'stopped';
    this.listeners.delete(id);

    // Remove from persistent store if not persistent
    if (!listener.config.persistent) {
      this.persistentStore.delete(id);
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

  // Create backpressure-aware event stream
  private createEventStream(config: ListenerConfig): ReadableStream {
    let controller: ReadableStreamDefaultController;

    const stream = new ReadableStream({
      start(ctrl) {
        controller = ctrl;
      },

      async pull() {
        // Ready for more data - can resume viem watcher if paused
      },

      cancel() {
        console.log(`Stream cancelled for listener ${config.id}`);
      }
    }, {
      highWaterMark: 16, // Buffer size
      size: () => 1 // Each event counts as 1 unit
    });

    // Process stream with proper flow control
    this.processEventStream(stream, config);

    return stream;
  }

  private async processEventStream(stream: ReadableStream, config: ListenerConfig) {
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        try {
          await config.onEvent(value);

          // Auto-shutdown for temporary listeners
          if (!config.persistent) {
            await this.stopListener(config.id);
            break;
          }
        } catch (error) {
          console.error(`Error processing event in ${config.id}:`, error);
          // Could implement retry logic here
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async shutdown(): Promise<void> {
    const stopPromises = Array.from(this.listeners.keys()).map(id =>
      this.stopListener(id)
    );
    await Promise.all(stopPromises);
  }
}
