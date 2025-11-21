import env from "@/env";
import { SupportedChains } from "@flintapi/shared/Utils";
import { http, webSocket } from "viem";

export const RPC_URLS = {
  [SupportedChains.base]: env.BASE_RPC_TYPE === "websocket"? env.BASE_RPC : env.BASE_RPC_HTTP,
  [SupportedChains.baseSepolia]: env.BASE_SEPOLIA_RPC,
  [SupportedChains.bsc]: env.BSC_RPC_TYPE === "websocket"? env.BSC_RPC : env.BSC_RPC_HTTP,
  [SupportedChains.bscTestnet]: env.BSC_TESTNET_RPC,
};

export const getTransport = (rpc: string, chainId: number) => {
  switch(chainId) {
    case SupportedChains.base:
    case SupportedChains.baseSepolia:
      return env.BASE_RPC_TYPE === "websocket"? webSocket(rpc, {keepAlive: {interval: 100}, retryDelay: 200, retryCount: 100_000}) : http(rpc, {retryCount: 100_000, retryDelay: 200, timeout: 100_000});
    case SupportedChains.bsc:
    case SupportedChains.bscTestnet:
      return env.BSC_RPC_TYPE === "websocket"? webSocket(rpc, {keepAlive: {interval: 100}, retryDelay: 200, retryCount: 100_000}) : http(rpc, {retryCount: 100_000, retryDelay: 200, timeout: 100_000});
    default:
      return http(rpc, {retryCount: 100_000, retryDelay: 200, timeout: 100_000});
  }
  
}
