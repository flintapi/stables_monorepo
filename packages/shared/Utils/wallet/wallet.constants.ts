import { BundlerCollection, ChainId } from "./wallet.entities";

export enum SupportedChains {
  bsc = 56,
  bscTestnet = 97,
  base = 8453,
  baseSepolia = 84532,
}

export const BUNDLER_URLS: BundlerCollection = new Map([
  [SupportedChains.baseSepolia, [`https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/84532`]],
  [SupportedChains.bscTestnet, [`https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/97`]]
]);

// Supported token address constants
export const TOKEN_ADDRESSES = {
  [SupportedChains.baseSepolia]: {
    usdc: {address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", decimal: 6},
    usdt: {address: "0x323e78f944A9a1FcF3a10efcC5319DBb0bB6e673", decimal: 6},
    cngn: {address: "0x7E29CF1D8b1F4c847D0f821b79dDF6E67A5c11F8", decimal: 6},
  },
  [SupportedChains.base]: {
    usdc: {address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimal: 6},
    usdt: {address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimal: 6},
    cngn: {address: "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F", decimal: 6},
  },
  [SupportedChains.bsc]: {
    usdc: {address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimal: 18},
    usdt: {address: "0x55d398326f99059ff775485246999027b3197955", decimal: 18},
    cngn: {address: "0xa8AEA66B361a8d53e8865c62D142167Af28Af058", decimal: 6},
  },
  [SupportedChains.bscTestnet]: {
    usdc: {address: "0x64544969ed7EBf5f083679233325356EbE738930", decimal: 18},
    usdt: {address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", decimal: 18},
    cngn: {address: "0xA8945B7B12a3808EFD68B072b54E6dae4f0d7AEa", decimal: 6},
  },
}

export const tokenDecimals = {

}

export const networkToChainidMap: Record<string, ChainId> = {
  "base": process.env.NODE_ENV === "development"? 84532 : 8453,
  "bsc": process.env.NODE_ENV === "development"? 97 : 56,
}
