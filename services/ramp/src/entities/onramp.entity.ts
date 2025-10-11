// Entity types for the onramp service

type InAsset = "NGN" | "USD" | "EUR"; // fiat
type OutAsset = "cNGN" | "USDT" | "USDC" | "USDC"; // stablecoin

export interface OnRampInitDto {
  inAsset: InAsset;
  outAsset: OutAsset;
  amount: number;
  receivingAddress?: `0x${string}`;
}

export interface OnRampFinalizeDto {
  quoteId: `quote_${string}`;
}
