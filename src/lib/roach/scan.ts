import {
  BRIDGED_ASSETS,
  ROACH_FA_DECIMALS,
  ROACH_FA_METADATA,
  SUPRA_MAINNET_RPC,
  SUPRA_TESTNET_RPC,
} from "./constants";
import { classify, extractCoinType } from "./classify";
import { formatBalance, formatUsd } from "@/lib/utils";
import type { ChainNet, DustToken } from "./types";

async function view(
  rpc: string,
  functionName: string,
  typeArgs: string[],
  args: string[],
): Promise<unknown> {
  const res = await fetch(`${rpc}/rpc/v1/view`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      function: functionName,
      type_arguments: typeArgs,
      arguments: args,
    }),
  });
  const json = await res.json();
  if (!res.ok || json?.message) return null;
  return json?.result ?? json;
}

function asBig(v: unknown): bigint {
  const x = Array.isArray(v) ? v[0] : v;
  if (x === null || x === undefined) return 0n;
  try {
    return BigInt(String(x));
  } catch {
    return 0n;
  }
}

function normalizeCoinType(raw: string): string {
  const inner = extractCoinType(raw) || raw;
  const parts = inner.split("::");
  if (parts.length < 3) return inner;
  let addr = parts[0];
  if (!addr.startsWith("0x")) addr = `0x${addr}`;
  return `${addr}::${parts[1]}::${parts.slice(2).join("::")}`;
}

function toToken(
  coinType: string,
  rawValue: bigint,
  decimals: number,
  supraPrice: number | null,
  network: ChainNet,
): DustToken | null {
  if (rawValue <= 0n) return null;
  const c = classify(coinType);
  let usdValue: string | undefined;
  if (c.kind === "supra" && supraPrice) {
    usdValue = formatUsd((Number(rawValue) / 10 ** decimals) * supraPrice);
  }
  return {
    id: `${c.kind}:${network}:${coinType}`,
    coinType,
    balance: formatBalance(rawValue, decimals),
    rawValue,
    decimals,
    kind: c.kind,
    symbol: c.symbol,
    name: c.name,
    usdValue,
    bridged: c.bridged,
    network,
  };
}

async function scanCoins(
  address: string,
  network: ChainNet,
  rpc: string,
  supraPrice: number | null,
): Promise<DustToken[]> {
  const found: DustToken[] = [];
  const seen = new Set<string>();
  const push = (t: DustToken | null) => {
    if (!t || seen.has(t.id)) return;
    seen.add(t.id);
    found.push(t);
  };

  const supra = asBig(
    await view(rpc, "0x1::coin::balance", ["0x1::supra_coin::SupraCoin"], [
      address,
    ]),
  );
  push(toToken("0x1::supra_coin::SupraCoin", supra, 8, supraPrice, network));

  try {
    const res = await fetch(`${rpc}/rpc/v1/accounts/${address}/resources`);
    const json = await res.json();
    const pairs: unknown[] =
      json?.Resources?.resource ?? json?.result ?? json?.resources ?? [];
    const types = new Set<string>();
    for (const item of pairs) {
      const typeStr = Array.isArray(item) ? String(item[0] ?? "") : String(item);
      if (!typeStr.includes("CoinStore")) continue;
      types.add(normalizeCoinType(typeStr));
    }
    for (const coinType of types) {
      if (coinType.toLowerCase().includes("supra_coin::supracoin")) continue;
      const raw = asBig(
        await view(rpc, "0x1::coin::balance", [coinType], [address]),
      );
      push(toToken(coinType, raw, 8, supraPrice, network));
    }
  } catch {
    /* SUPRA still returned */
  }
  return found;
}

async function scanBridged(
  address: string,
  supraPrice: number | null,
): Promise<DustToken[]> {
  const found: DustToken[] = [];
  for (const asset of BRIDGED_ASSETS) {
    const raw = asBig(
      await view(
        SUPRA_MAINNET_RPC,
        "0x1::primary_fungible_store::balance",
        ["0x1::fungible_asset::Metadata"],
        [address, asset.metadata],
      ),
    );
    const base = toToken(
      asset.metadata,
      raw,
      asset.decimals,
      supraPrice,
      "mainnet",
    );
    if (!base) continue;
    found.push({
      ...base,
      kind: "bridged",
      symbol: asset.symbol,
      name: asset.label,
      bridged: asset,
      id: `bridged:mainnet:${asset.metadata}`,
    });
  }
  return found;
}

export async function scanAccount(
  address: string,
  supraPrice: number | null,
): Promise<DustToken[]> {
  const [main, test, bridged, roachRaw] = await Promise.all([
    scanCoins(address, "mainnet", SUPRA_MAINNET_RPC, supraPrice),
    scanCoins(address, "testnet", SUPRA_TESTNET_RPC, supraPrice),
    scanBridged(address, supraPrice),
    view(
      SUPRA_MAINNET_RPC,
      "0x1::primary_fungible_store::balance",
      ["0x1::fungible_asset::Metadata"],
      [address, ROACH_FA_METADATA],
    ).then(asBig),
  ]);
  const found = [...test, ...main, ...bridged];
  const roach = toToken(
    ROACH_FA_METADATA,
    roachRaw,
    ROACH_FA_DECIMALS,
    null,
    "mainnet",
  );
  if (roach) {
    found.push({
      ...roach,
      kind: "keep",
      symbol: "ROACH",
      name: "CockARoach Survivalist",
      id: `keep:mainnet:${ROACH_FA_METADATA}`,
    });
  }
  found.sort((a, b) => {
    const kind =
      ({ dust: 0, supra: 1, bridged: 2, keep: 3 }[a.kind] -
        { dust: 0, supra: 1, bridged: 2, keep: 3 }[b.kind]);
    if (kind !== 0) return kind;
    if (a.network !== b.network) return a.network === "testnet" ? -1 : 1;
    return 0;
  });
  return found;
}
