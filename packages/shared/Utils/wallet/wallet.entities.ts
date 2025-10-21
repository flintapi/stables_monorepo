import * as supportedChains from "./wallet.chains";

export enum SupportedChains {
  bsc = 56,
  bscTestnet = 97,
  base = 8453,
  baseSepolia = 84532,
}

export type Network = "base" | "bsc";

// Collection of available bundler URLs
const ids = Object.values(supportedChains).map((network) => network.id);
export type ChainId = (typeof ids)[number];
export type BundlerCollection = Map<ChainId, Array<string>>;

export interface IndexManager {
  get: (keyLabel: string) => Promise<number>; // get the last recorded index for the keyLabel
  set: (keyLabel: string, index: number) => Promise<void>;
}
