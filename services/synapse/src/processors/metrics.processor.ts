import { ListenerConfig } from '@/lib/types';
import { Writable } from 'stream';

// Metrics Collector - Writable stream that tracks statistics
export class MetricsCollector extends Writable {
  private metrics = {
    totalEvents: 0,
    eventsByType: new Map<string, number>(),
    eventsByListener: new Map<string, number>(),
    eventsPerMinute: 0,
    lastMinuteCount: 0,
    errors: 0,
    startTime: Date.now()
  };

  private metricsInterval: NodeJS.Timeout;

  private config: ListenerConfig;
  private listenerId: string;

  constructor(config: ListenerConfig, listenerId: string) {
    super({
      objectMode: true,
      highWaterMark: 8
    });

    this.config = config;
    this.listenerId = listenerId;

    // Update events per minute every 60 seconds
    this.metricsInterval = setInterval(() => {
      this.metrics.eventsPerMinute = this.metrics.lastMinuteCount;
      this.metrics.lastMinuteCount = 0;
    }, 60000);
  }

  async _write(event: any, encoding: string, callback: Function) {
    try {
      // Increment counters
      this.metrics.totalEvents++;
      this.metrics.lastMinuteCount++;

      // Track by event type
      const eventType = event.eventName || event.topics?.[0] || 'unknown';
      this.metrics.eventsByType.set(
        eventType,
        (this.metrics.eventsByType.get(eventType) || 0) + 1
      );

      // Track by listener
      const listenerId = event.listenerId || 'unknown';
      this.metrics.eventsByListener.set(
        listenerId,
        (this.metrics.eventsByListener.get(listenerId) || 0) + 1
      );

      if (!this.config.persistent) {
        this.emit('shutdown', this.listenerId);
      }

      callback(null, event);
    } catch (error) {
      this.metrics.errors++;
      console.error('Metrics collection error:', error);
      callback(error);
    }
  }

  _final(callback: Function) {
    clearInterval(this.metricsInterval);
    callback();
  }

  // Get current metrics snapshot
  getMetrics() {
    const uptimeSeconds = (Date.now() - this.metrics.startTime) / 1000;

    return {
      ...this.metrics,
      eventsByType: Object.fromEntries(this.metrics.eventsByType),
      eventsByListener: Object.fromEntries(this.metrics.eventsByListener),
      uptimeSeconds,
      averageEventsPerSecond: this.metrics.totalEvents / uptimeSeconds
    };
  }

  // Print metrics to console
  printMetrics() {
    const metrics = this.getMetrics();
    console.log('\n=== Event Listener Metrics ===');
    console.log(`Total Events: ${metrics.totalEvents}`);
    console.log(`Events/Minute: ${metrics.eventsPerMinute}`);
    console.log(`Avg Events/Second: ${metrics.averageEventsPerSecond.toFixed(2)}`);
    console.log(`Errors: ${metrics.errors}`);
    console.log(`Uptime: ${metrics.uptimeSeconds.toFixed(0)}s`);
    console.log('\nEvents by Type:');
    Object.entries(metrics.eventsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log('==============================\n');
  }
}
