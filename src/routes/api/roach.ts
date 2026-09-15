import { createFileRoute } from "@tanstack/react-router";
import {
  ATMOS_PUMP_MODULE,
  ROACH_FA_DECIMALS,
  ROACH_FA_METADATA,
  ROACH_PUMP_POOL,
  SUPRA_MAINNET_RPC,
} from "@/lib/roach/constants";
import { formatBalance } from "@/lib/utils";

async function view(fn: string, typeArgs: string[], args: string[]) {
  const res = await fetch(`${SUPRA_MAINNET_RPC}/rpc/v1/view`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      function: fn,
      type_arguments: typeArgs,
      arguments: args,
    }),
  });
  return res.json();
}

export const Route = createFileRoute("/api/roach")({
  server: {
    handlers: {
      GET: async () => {
        const [details, supply] = await Promise.all([
          view(`${ATMOS_PUMP_MODULE}::atmos_pump::get_token_details`, [], [
            ROACH_PUMP_POOL,
          ]),
          view("0x1::fungible_asset::supply", ["0x1::fungible_asset::Metadata"], [
            ROACH_FA_METADATA,
          ]),
        ]);
        const d = (details?.result?.[0] ?? details?.result ?? {}) as {
          name?: string;
          symbol?: string;
          holders?: string;
          volume_supra?: string;
          is_completed?: boolean;
          is_crowned?: boolean;
          token_address?: string;
        };
        const vec = supply?.result?.[0]?.vec ?? supply?.result;
        const rawSupply = Array.isArray(vec) ? vec[0] : vec;
        let supplyRaw = 0n;
        try {
          supplyRaw = BigInt(String(rawSupply || "0"));
        } catch {
          supplyRaw = 0n;
        }
        const max = 1_000_000_000n * 10n ** BigInt(ROACH_FA_DECIMALS);
        const burned = max > supplyRaw ? max - supplyRaw : 0n;
        let volume = "—";
        try {
          volume = formatBalance(BigInt(d.volume_supra || "0"), 8);
        } catch {
          volume = "—";
        }
        return Response.json({
          name: d.name || "CockARoach Survivalist",
          symbol: d.symbol || "ROACH",
          graduated: Boolean(d.is_completed),
          crowned: Boolean(d.is_crowned),
          holders: String(d.holders ?? "—"),
          volumeSupra: volume,
          supply: formatBalance(supplyRaw, ROACH_FA_DECIMALS),
          burned: formatBalance(burned, ROACH_FA_DECIMALS),
          token: d.token_address || ROACH_FA_METADATA,
          pool: ROACH_PUMP_POOL,
        });
      },
    },
  },
});
