import {
  BRIDGED_ASSETS,
  KNOWN_DUST_TOKENS,
  ROACH_FA_METADATA,
  ROACH_TOKEN_ADDRESS,
  TOKEN_BRIDGE_ACCOUNT,
  type BridgedAsset,
} from "./constants";
import { normalizeHex } from "./bcs";

export type TokenKind = "supra" | "bridged" | "keep" | "dust";

export type Classified = {
  kind: TokenKind;
  symbol: string;
  name?: string;
  bridged?: BridgedAsset;
};

export function extractCoinType(typeStr: string): string | null {
  const match = typeStr.match(/CoinStore<(.+)>$/);
  if (match) return match[1];
  const inner = typeStr.match(/<([^>]+)>/);
  return inner ? inner[1] : null;
}

function shortType(coinType: string): string {
  const parts = coinType.split("::");
  return parts[parts.length - 1] || coinType;
}

export function classify(coinType: string): Classified {
  const lower = coinType.toLowerCase();
  const raw = normalizeHex(coinType);

  if (lower.includes("supra_coin::supracoin")) {
    return { kind: "supra", symbol: "SUPRA", name: "Supra" };
  }

  const roachHex = normalizeHex(ROACH_TOKEN_ADDRESS);
  const roachFa = normalizeHex(ROACH_FA_METADATA);
  if (
    raw.includes(roachHex) ||
    raw.includes(roachFa) ||
    lower.includes("::roach") ||
    lower.includes("cockaroach")
  ) {
    return { kind: "keep", symbol: "ROACH", name: "CockARoach Survivalist" };
  }

  for (const known of KNOWN_DUST_TOKENS) {
    if (lower.includes(known.match.toLowerCase())) {
      return { kind: "dust", symbol: known.symbol, name: known.name };
    }
  }

  for (const asset of BRIDGED_ASSETS) {
    const meta = normalizeHex(asset.metadata);
    if (raw.includes(meta) || lower.includes(asset.symbol.toLowerCase())) {
      return {
        kind: "bridged",
        symbol: asset.symbol,
        name: asset.label,
        bridged: asset,
      };
    }
  }

  if (
    raw.includes(normalizeHex(TOKEN_BRIDGE_ACCOUNT)) ||
    /sup(eth|usdc|usdt|btc|solvbtc)/i.test(coinType)
  ) {
    return { kind: "bridged", symbol: shortType(coinType), name: "Bridged FA" };
  }

  return { kind: "dust", symbol: shortType(coinType) };
}
