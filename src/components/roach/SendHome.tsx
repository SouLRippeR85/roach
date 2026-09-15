import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ETHEREUM_CHAIN_ID, SUPRANOVA_URL } from "@/lib/roach/constants";
import { isEvmAddress } from "@/lib/roach/bcs";
import { sendTokensHome } from "@/lib/roach/tx";
import type { DustToken } from "@/lib/roach/types";
import {
  friendlyTxError,
  getStarKey,
} from "@/lib/roach/wallet";

type Props = {
  token: DustToken;
  address: string;
  source: "starkey" | "demo";
  onDone: (msg: string) => void;
  onError: (msg: string | null) => void;
};

export function SendHome({ token, address, source, onDone, onError }: Props) {
  const [evm, setEvm] = useState("");
  const [amount, setAmount] = useState(token.balance.replace(/,/g, ""));
  const [unwrap, setUnwrap] = useState(token.symbol === "supETH");
  const [busy, setBusy] = useState(false);

  const home = unwrap
    ? token.bridged?.unwrapHome ?? token.bridged?.home ?? "ETH"
    : token.bridged?.home ?? "Ethereum";

  const parseAmount = (): bigint | null => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    return BigInt(Math.floor(n * 10 ** token.decimals));
  };

  const submit = async () => {
    onError(null);
    if (!isEvmAddress(evm)) {
      onError("Enter a valid Ethereum recipient (0x + 40 hex).");
      return;
    }
    const raw = parseAmount();
    if (raw === null || raw > token.rawValue) {
      onError("Amount must be greater than zero and within balance.");
      return;
    }
    setBusy(true);
    try {
      if (source === "demo") {
        await new Promise((r) => setTimeout(r, 900));
        onDone(
          `Preview: ${amount} ${token.symbol} would send_tokens to ${evm.slice(0, 8)}… as ${home} (chain ${ETHEREUM_CHAIN_ID}).`,
        );
        return;
      }
      const provider = getStarKey();
      if (!provider) throw new Error("StarKey not found");
      await sendTokensHome(
        provider,
        address,
        token.coinType,
        token.bridged?.metadata ?? token.coinType,
        raw,
        evm.trim(),
        unwrap,
      );
      onDone(`Bridge-out submitted: ${token.symbol} → ${home}`);
    } catch (e) {
      onError(friendlyTxError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-sky/25 bg-sky/5 p-3">
      <p className="text-xs text-muted">
        Phase B calls{" "}
        <span className="font-mono text-fg/80">
          token_bridge_service::send_tokens
        </span>{" "}
        on Supra. The wrapped FA is burned; the original is released on
        Ethereum. Not a ROACH burn.
      </p>
      <label className="block text-[11px] font-medium text-muted">
        Ethereum recipient
        <input
          value={evm}
          onChange={(e) => setEvm(e.target.value)}
          placeholder="0x…"
          className="mt-1 h-11 w-full rounded-lg border border-border bg-bg px-3 font-mono text-sm text-fg placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
      </label>
      <label className="block text-[11px] font-medium text-muted">
        Amount ({token.symbol})
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 h-11 w-full rounded-lg border border-border bg-bg px-3 font-mono text-sm text-fg focus:border-accent/50 focus:outline-none"
        />
      </label>
      {token.symbol === "supETH" && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-fg">
          <input
            type="checkbox"
            checked={unwrap}
            onChange={(e) => setUnwrap(e.target.checked)}
          />
          Unwrap to native ETH (otherwise WETH)
        </label>
      )}
      <Button
        className="w-full"
        disabled={busy}
        onClick={() => void submit()}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowUpRight className="size-4" />
        )}
        Send {token.symbol} → {home}
      </Button>
      <a
        href={SUPRANOVA_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-sky hover:underline"
      >
        Open SupraNova instead
        <ArrowUpRight className="size-3" />
      </a>
    </div>
  );
}
