import { QueueEvents } from "bullmq";
import {CacheFacade} from "../Cache/cache.facade";

type GlobalWithQueueEvents = typeof globalThis & {
    __queueEventsCache?: Map<string, QueueEvents>;
};

function getCache() {
    const g = globalThis as GlobalWithQueueEvents;
    if (!g.__queueEventsCache) {
        g.__queueEventsCache = new Map();
    }
    return g.__queueEventsCache;
}

export function getQueueEvents(name: string): QueueEvents {
    const cache = getCache();
    let events = cache.get(name);
    if (!events) {
        events = new QueueEvents(name, { connection: CacheFacade.redisCache });
        cache.set(name, events);
    }
    return events;
}

export function ensureQueueEventHandlers(
    name: string,
    setup: (events: QueueEvents) => void
): QueueEvents {
    const events = getQueueEvents(name);
    const marker = `__handlers_registered_${name}`;
    // @ts-ignore - attach a non-enumerable marker to the instance
    if (!(events as any)[marker]) {
        setup(events);
        Object.defineProperty(events, marker, { value: true, enumerable: false });
    }
    return events;
}
