import type {
  BundlerCollection,
  ChainId,
  Network,
} from "@flintapi/shared/Utils";
import { SupportedChains } from "@flintapi/shared/Utils";

export const BUNDLER_URLS: BundlerCollection = new Map([
  [
    SupportedChains.baseSepolia,
    [
      `https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/84532`,
    ],
  ],
  [
    SupportedChains.bscTestnet,
    [
      `https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/97`,
      `https://api.pimlico.io/v2/97/rpc?apikey=pim_ZkLxqjsRCe4FRVhkd5LQQG`,
    ],
  ],
]);

export const PAYMASTER_RPC = {
  [SupportedChains.baseSepolia]: {
    url: `https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/84532`,
  },
  [SupportedChains.bscTestnet]: {
    url: `https://api.pimlico.io/v2/97/rpc?apikey=pim_ZkLxqjsRCe4FRVhkd5LQQG`,
  },
};

export function getBundlerUrl(chainId: ChainId, network: SupportedChains) {
  switch (network) {
    case SupportedChains.baseSepolia:
    case SupportedChains.bscTestnet:
      return `https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/${chainId.toString()}?provider=PIMLICO`;
    // return `https://api.pimlico.io/v2/${chainId.toString() || "97"}/rpc?apikey=${process.env.PIMLICO_API_KEY || "pim_ZkLxqjsRCe4FRVhkd5LQQG"}`;
    case SupportedChains.bsc:
    case SupportedChains.base:
      return `https://api.pimlico.io/v2/${chainId.toString() || "97"}/rpc?apikey=${process.env.PIMLICO_API_KEY || "pim_ZkLxqjsRCe4FRVhkd5LQQG"}`;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export function getPaymasterUrl(chainId: ChainId, network: SupportedChains) {
  switch (network) {
    case SupportedChains.bscTestnet:
      return `https://api.pimlico.io/v2/${chainId.toString() || "97"}/rpc?apikey=${process.env.PIMLICO_API_KEY || "pim_ZkLxqjsRCe4FRVhkd5LQQG"}`;
    case SupportedChains.bsc:
    case SupportedChains.base:
    case SupportedChains.baseSepolia:
      return `https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/${chainId.toString()}`;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

// Supported token address constants
export const TOKEN_ADDRESSES = {
  [SupportedChains.baseSepolia]: {
    usdc: { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", decimal: 6 },
    usdt: { address: "0x323e78f944A9a1FcF3a10efcC5319DBb0bB6e673", decimal: 6 },
    cngn: { address: "0x929A08903C22440182646Bb450a67178Be402f7f", decimal: 6 },
  },
  [SupportedChains.base]: {
    usdc: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimal: 6 },
    usdt: { address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimal: 6 },
    cngn: { address: "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F", decimal: 6 },
  },
  [SupportedChains.bsc]: {
    usdc: {
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      decimal: 18,
    },
    usdt: {
      address: "0x55d398326f99059ff775485246999027b3197955",
      decimal: 18,
    },
    cngn: { address: "0xa8AEA66B361a8d53e8865c62D142167Af28Af058", decimal: 6 },
  },
  [SupportedChains.bscTestnet]: {
    usdc: {
      address: "0x64544969ed7EBf5f083679233325356EbE738930",
      decimal: 18,
    },
    usdt: {
      address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
      decimal: 18,
    },
    cngn: { address: "0x20354A3Ad3B67836ab9c6D7D82cF5e5Ddfe104dD", decimal: 6 },
  },
};

export const networkToChainidMap: Record<Network, ChainId> = {
  base: process.env.NODE_ENV === "development" ? 84532 : 8453,
  bsc: process.env.NODE_ENV === "development" ? 97 : 56,
};
