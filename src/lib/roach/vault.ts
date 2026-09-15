import {
  SUPRA_TESTNET_RPC,
  VAULT_MODULE_ADDRESS,
  VAULT_MODULE_NAME,
} from "./constants";

export type StakeView = {
  id: number;
  amount: bigint;
  unlockTime: number;
  duration: number;
  unlocked: boolean;
  secondsLeft: number;
};

export type VaultStats = {
  totalLocked: bigint;
  paused: boolean;
  admin: string | null;
};

const VIEW = `${SUPRA_TESTNET_RPC}/rpc/v1/view`;
const FN = `${VAULT_MODULE_ADDRESS}::${VAULT_MODULE_NAME}`;

async function view(functionName: string, args: string[] = []): Promise<unknown> {
  const res = await fetch(VIEW, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      function: `${FN}::${functionName}`,
      type_arguments: [],
      arguments: args,
    }),
  });
  if (!res.ok) throw new Error(`Vault view failed (${res.status})`);
  const json = await res.json();
  return json?.result ?? json;
}

export async function fetchVaultStats(): Promise<VaultStats> {
  try {
    const [total, paused, admin] = await Promise.all([
      view("get_total_locked"),
      view("is_paused"),
      view("get_admin"),
    ]);
    const t = Array.isArray(total) ? total[0] : total;
    const p = Array.isArray(paused) ? paused[0] : paused;
    const a = Array.isArray(admin) ? admin[0] : admin;
    return {
      totalLocked: BigInt(String(t ?? 0)),
      paused: Boolean(p),
      admin: a ? String(a) : null,
    };
  } catch {
    return { totalLocked: 0n, paused: false, admin: null };
  }
}

export async function fetchUserStakes(user: string): Promise<StakeView[]> {
  try {
    const result = (await view("get_user_stakes", [user])) as unknown[];
    const ids = (result?.[0] as unknown[]) ?? [];
    const amounts = (result?.[1] as unknown[]) ?? [];
    const unlocks = (result?.[2] as unknown[]) ?? [];
    const durations = (result?.[3] as unknown[]) ?? [];
    const now = Math.floor(Date.now() / 1000);
    const stakes: StakeView[] = [];
    for (let i = 0; i < ids.length; i++) {
      const unlockTime = Number(unlocks[i] ?? 0);
      const secondsLeft = Math.max(0, unlockTime - now);
      stakes.push({
        id: Number(ids[i]),
        amount: BigInt(String(amounts[i] ?? 0)),
        unlockTime,
        duration: Number(durations[i] ?? 0),
        unlocked: secondsLeft === 0,
        secondsLeft,
      });
    }
    return stakes;
  } catch {
    return [];
  }
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Unlocked";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatUnlockTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function toOnChainAmount(human: string): bigint {
  const n = parseFloat(human);
  if (!Number.isFinite(n) || n <= 0) return 0n;
  return BigInt(Math.floor(n * 1e8));
}
