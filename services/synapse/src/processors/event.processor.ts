import { Transform } from 'stream';
import { ListenerConfig } from '../lib/types';

// Custom EventProcessor class where events are processed
export class EventProcessor extends Transform {
  private config: ListenerConfig;
  private listenerId: string;

  constructor(config: ListenerConfig, listenerId: string) {
    super({
      objectMode: true,      // Handles objects, not just buffers
      highWaterMark: 8       // Can buffer up to 8 events
    });
    this.config = config;
    this.listenerId = listenerId;
  }

  async _transform(event: any, encoding: string, callback: Function) {
    try {
      // This is where your custom logic runs
      await this.config.onEvent(event);

      // const source = new EventSource(`https://example.com/events`);

      // If temporary listener, signal shutdown after first event
      if (!this.config.persistent) {
        this.emit('shutdown', this.listenerId);
      }

      // Pass event downstream (if there were more stages)
      callback(null, event);
    } catch (error) {
      // Handle errors without crashing the stream
      console.error(`Error processing event in ${this.listenerId}:`, error);
      callback(error);
    }
  }
}
