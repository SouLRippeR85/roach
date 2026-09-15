import { SUPRA_MAINNET_CHAIN_ID, VAULT_TESTNET_CHAIN_ID } from "./constants";
import type { ChainNet } from "./types";

export type StarKeyProvider = {
  account: () => Promise<unknown>;
  connect?: (opts?: { chainId?: string | number; multiple?: boolean }) => Promise<unknown>;
  on?: (event: string, cb: (accs: unknown) => void) => void;
  createRawTransactionData: (payload: unknown) => Promise<unknown>;
  sendTransaction: (args: { data: unknown }) => Promise<unknown>;
  getChainId?: () => Promise<unknown>;
  changeNetwork?: (args: { chainId: string }) => Promise<unknown>;
};

export function getStarKey(): StarKeyProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    starkey?: { supra?: StarKeyProvider };
    starKey?: { supra?: StarKeyProvider };
    starKeyWallet?: StarKeyProvider;
  };
  return w.starkey?.supra ?? w.starKey?.supra ?? w.starKeyWallet ?? null;
}

export function inIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function pickAddress(accounts: unknown): string | null {
  const first = Array.isArray(accounts) ? accounts[0] : accounts;
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "address" in first) {
    const a = (first as { address?: unknown }).address;
    return typeof a === "string" ? a : null;
  }
  return null;
}

export function chainIdFor(network: ChainNet): string {
  return network === "testnet" ? VAULT_TESTNET_CHAIN_ID : SUPRA_MAINNET_CHAIN_ID;
}

function readChainId(chain: unknown): string {
  if (chain == null) return "";
  if (typeof chain === "string" || typeof chain === "number") return String(chain);
  if (typeof chain === "object" && "chainId" in chain) {
    return String((chain as { chainId: unknown }).chainId ?? "");
  }
  return "";
}

export async function ensureChain(
  provider: StarKeyProvider,
  chainId: string,
): Promise<void> {
  let current = "";
  try {
    current = readChainId(await provider.getChainId?.());
  } catch {
    current = "";
  }
  if (current && current.replace(/^0x/, "") === chainId.replace(/^0x/, "")) {
    return;
  }
  if (!provider.changeNetwork) {
    throw new Error(
      chainId === VAULT_TESTNET_CHAIN_ID
        ? "Switch StarKey to Supra Testnet and try again"
        : "Switch StarKey to Supra Mainnet and try again",
    );
  }
  await provider.changeNetwork({ chainId });
}

export async function connectStarKeyWallet(chainId?: string): Promise<{
  provider: StarKeyProvider;
  address: string;
}> {
  const provider = getStarKey();
  if (!provider) throw new Error("StarKey not found — install the extension");
  const accounts = provider.connect
    ? await provider.connect(chainId ? { chainId } : undefined)
    : await provider.account();
  const address = pickAddress(accounts);
  if (!address) throw new Error("StarKey returned no account");
  if (chainId) await ensureChain(provider, chainId);
  return { provider, address };
}

export function friendlyTxError(err: unknown): string {
  const raw = String(
    (err as { message?: string })?.message ||
      (err as { data?: { message?: string } })?.data?.message ||
      err ||
      "Transaction failed",
  );
  const lower = raw.toLowerCase();
  if (
    lower.includes("reject") ||
    lower.includes("denied") ||
    lower.includes("cancel") ||
    lower.includes("user closed")
  ) {
    return "Transaction cancelled";
  }
  if (lower.includes("not found") && lower.includes("starkey")) {
    return "StarKey not found — using colony preview, or install the extension";
  }
  if (lower.includes("insufficient") || lower.includes("not enough")) {
    return "Not enough balance (or gas) to complete this transfer";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Transaction timed out. Check the StarKey popup.";
  }
  if (
    lower.includes("chain") ||
    lower.includes("network") ||
    lower.includes("wrong network") ||
    lower.includes("unrecognized chain")
  ) {
    return "Switch StarKey to the required network and try again";
  }
  if (
    /\babort[^\d]*5\b/.test(lower) ||
    lower.includes("e_lock_not_expired") ||
    lower.includes("not unlocked")
  ) {
    return "This stake is still locked — wait until the unlock time";
  }
  if (lower.includes("stake not found") || lower.includes("e_stake_not_found")) {
    return "Stake not found — it may already be withdrawn";
  }
  if (lower.includes("paused") || /\babort[^\d]*8\b/.test(lower)) {
    return "Vault is paused — new stakes are temporarily disabled";
  }
  if (lower.includes("e_not_admin") || /\babort[^\d]*1\b/.test(lower)) {
    return "Only the vault admin can do that";
  }
  if (raw.length > 180) return "Transaction failed — see the console for details";
  return raw;
}

export function txHashFromResult(result: unknown): string | null {
  if (!result) return null;
  if (typeof result === "string" && /^0x[0-9a-fA-F]+$/.test(result)) return result;
  const obj = result as Record<string, unknown>;
  const cand =
    obj.txHash || obj.hash || obj.transactionHash || obj.txnHash;
  return typeof cand === "string" ? cand : null;
}
