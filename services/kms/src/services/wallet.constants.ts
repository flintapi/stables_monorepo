import env from "@/env";
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
      `https://rpc.zerodev.app/api/v3/${env.ZERODEV_PROJECT_ID}/chain/84532`,
    ],
  ],
  [
    SupportedChains.bscTestnet,
    [
      `https://rpc.zerodev.app/api/v3/${env.ZERODEV_PROJECT_ID}/chain/97`,
      `https://api.pimlico.io/v2/97/rpc?apikey=${env.PIMLICO_API_KEY}`,
    ],
  ],
]);

export const PAYMASTER_RPC = {
  [SupportedChains.baseSepolia]: {
    url: `https://rpc.zerodev.app/api/v3/${env.ZERODEV_PROJECT_ID}/chain/84532`,
  },
  [SupportedChains.bscTestnet]: {
    url: `https://api.pimlico.io/v2/97/rpc?apikey=${env.PIMLICO_API_KEY}`,
  },
};

export function getBundlerUrl(chainId: ChainId, network: SupportedChains) {
  switch (network) {
    case SupportedChains.baseSepolia:
    case SupportedChains.bscTestnet:
      return `https://rpc.zerodev.app/api/v3/${env.ZERODEV_PROJECT_ID}/chain/${chainId.toString()}?provider=PIMLICO`;
    // return `https://api.pimlico.io/v2/${chainId.toString() || "97"}/rpc?apikey=${process.env.PIMLICO_API_KEY || "pim_ZkLxqjsRCe4FRVhkd5LQQG"}`;
    case SupportedChains.bsc:
    case SupportedChains.base:
      return `https://rpc.zerodev.app/api/v3/${env.ZERODEV_PROJECT_ID}/chain/${chainId.toString()}?provider=PIMLICO`;
      // return `https://api.pimlico.io/v2/${chainId.toString() || "97"}/rpc?apikey=${process.env.PIMLICO_API_KEY || "pim_ZkLxqjsRCe4FRVhkd5LQQG"}`;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export function getPaymasterUrl(chainId: ChainId, network: SupportedChains) {
  switch (network) {
    case SupportedChains.bscTestnet:
      return `https://api.pimlico.io/v2/${chainId.toString() || "97"}/rpc?apikey=${env.PIMLICO_API_KEY}}`;
    case SupportedChains.bsc:
    case SupportedChains.base:
    case SupportedChains.baseSepolia:
      return `https://rpc.zerodev.app/api/v3/${env.ZERODEV_PROJECT_ID}/chain/${chainId.toString()}`;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
