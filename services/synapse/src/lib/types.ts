import { Address } from "viem";
import { EventStream } from "../steams/event.stream";

// Event Listener Types
export interface EventFilter {
  address?: Address;
  args: { from: Address | Array<Address>; to: Address | Array<Address> };
  batch: boolean;
  fromBlock?: bigint;
}

export interface ListenerConfig {
  id: string;
  eventName: string;
  filter: EventFilter;
  persistent: boolean; // true for long-running, false for temporary
  timeout?: number; // kill temporary listener when timeout is reached and no event is received
  onEvent: (event: any) => Promise<void>;
  onStart?: () => Promise<void>;
  onStop?: () => Promise<void>;
}

export interface ListenerState {
  id: string;
  unwatch: () => void;
  config: ListenerConfig;
  status: 'active' | 'stopped';
  eventStream?: EventStream;
}
