import { BRIDGED_ASSETS, ROACH_FA_METADATA, ROACH_TOKEN_ADDRESS } from "./constants";
import { formatBalance, formatUsd } from "@/lib/utils";
import type { DustToken } from "./types";

/** Sample holdings matching the live colony wallet from 2 Sep 2026, plus one bridged FA so Phase B is playable. */
export const DEMO_ADDRESS = ROACH_TOKEN_ADDRESS;

export function demoTokens(supraPrice: number | null): DustToken[] {
  const credRaw = 9930n * 100_000_000n;
  const supraRaw = 1_098_397_300_000n; // 10,983.973 testnet
  const peckyRaw = 68_100_073_083n;
  const usdcRaw = 125_500000n;
  const usdc = BRIDGED_ASSETS.find((a) => a.symbol === "supUSDC")!;

  const supraAmount = Number(supraRaw) / 1e8;
  const usd = supraPrice ? formatUsd(supraAmount * supraPrice) : undefined;

  return [
    {
      id: "dust:testnet:cred",
      coinType:
        "0x23f2d0445e79880b0ddc345a6848599b860311186af6bf5a5eedf92a7dd8c714::cred_coin::CRED",
      balance: formatBalance(credRaw, 8),
      rawValue: credRaw,
      decimals: 8,
      kind: "dust",
      symbol: "CRED",
      name: "Repolia Credits",
      network: "testnet",
    },
    {
      id: "dust:mainnet:pecky",
      coinType:
        "0xe54b95920ef1cf9483705a32eab8526f270bc2f936dfb4112fd6ef971509d85d::Coin::Pecky",
      balance: formatBalance(peckyRaw, 8),
      rawValue: peckyRaw,
      decimals: 8,
      kind: "dust",
      symbol: "Pecky",
      network: "mainnet",
    },
    {
      id: "supra:testnet:supra",
      coinType: "0x1::supra_coin::SupraCoin",
      balance: formatBalance(supraRaw, 8),
      rawValue: supraRaw,
      decimals: 8,
      kind: "supra",
      symbol: "SUPRA",
      name: "Supra",
      usdValue: usd,
      network: "testnet",
    },
    {
      id: `bridged:mainnet:${usdc.metadata}`,
      coinType: usdc.metadata,
      balance: formatBalance(usdcRaw, usdc.decimals),
      rawValue: usdcRaw,
      decimals: usdc.decimals,
      kind: "bridged",
      symbol: usdc.symbol,
      name: usdc.label,
      bridged: usdc,
      network: "mainnet",
    },
    {
      id: `keep:mainnet:${ROACH_FA_METADATA}`,
      coinType: ROACH_FA_METADATA,
      balance: formatBalance(315_620_631_770_046n, 6),
      rawValue: 315_620_631_770_046n,
      decimals: 6,
      kind: "keep",
      symbol: "ROACH",
      name: "CockARoach Survivalist",
      network: "mainnet",
    },
  ];
}

export const DEMO_VAULT = {
  totalLocked: 11n * 100_000_000n,
  paused: false,
  positions: 1,
  stake: {
    id: 1,
    amount: 10n * 100_000_000n,
    unlocked: true,
    unlockLabel: "Unlock 24 Aug 2026, 05:05 · 7d lock",
  },
};
