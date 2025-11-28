import { Address } from "viem";
import { EventStream } from "../streams/event.stream";
import { EthStream } from "@/streams/eth.stream";

// Event Listener Types
export interface EventFilter {
  address?: Address;
  args: { from?: Address | Array<Address>; to?: Address | Array<Address> };
  eventName: "Transfer" | "Approval";
  fromBlock?: bigint;
}

export interface ListenerConfig {
  id: string;
  chainId: number;
  filter: EventFilter;
  persistent: boolean; // true for long-running, false for temporary
  fromBlock: bigint;
  timeout?: number; // kill temporary listener when timeout is reached and no event is received
  onEvent: (event: any) => Promise<void>;
  onStart?: () => Promise<void>;
  onStop?: () => Promise<void>;
}

export interface ListenerState {
  id: string;
  config: ListenerConfig;
  status: 'active' | 'stopped';
  eventStream?: EthStream; // Stream producing data
}
