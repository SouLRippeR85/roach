import type { TokenKind } from "./classify";
import type { BridgedAsset } from "./constants";

export type ChainNet = "mainnet" | "testnet";

export type DustToken = {
  id: string;
  coinType: string;
  balance: string;
  rawValue: bigint;
  decimals: number;
  kind: TokenKind;
  symbol: string;
  name?: string;
  usdValue?: string;
  bridged?: BridgedAsset;
  network: ChainNet;
};

export type WalletSource = "starkey" | "demo";
