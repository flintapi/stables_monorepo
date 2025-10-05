import { Readable } from 'stream';
import { ListenerConfig } from '../lib/types';

// Custom EventStream class for blockchain events
export class EventStream extends Readable {
  private buffer: any[] = [];
  private isWatcherPaused = false;
  private config: ListenerConfig;
  private maxBufferSize: number;

  constructor(config: ListenerConfig, options = { highWaterMark: 16 }) {
    super({
      objectMode: true,
      highWaterMark: options.highWaterMark
    });
    this.config = config;
    this.maxBufferSize = options.highWaterMark;
  }

  _read() {
    // Stream is ready for more data
    if (this.buffer.length > 0) {
      const event = this.buffer.shift();
      this.push(event);
    }

    // Resume watcher if it was paused due to backpressure
    if (this.isWatcherPaused && this.buffer.length < this.maxBufferSize / 2) {
      this.isWatcherPaused = false;
      this.emit('resume-watcher');
    }
  }

  addEvent(event: any): boolean {
    if (this.buffer.length >= this.maxBufferSize) {
      this.isWatcherPaused = true;
      this.emit('pause-watcher');
      return false; // Backpressure signal
    }

    this.buffer.push(event);
    this.push(this.buffer.shift());
    return true;
  }

  isPaused(): boolean {
    return this.isWatcherPaused;
  }
}
