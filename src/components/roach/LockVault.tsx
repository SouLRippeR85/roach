import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Pause,
  Play,
  Shield,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  VAULT_ADMIN,
  VAULT_DURATIONS,
  VAULT_MODULE_ADDRESS,
  VAULT_RESOURCE_ACCOUNT,
  VAULT_TESTNET_CHAIN_ID,
  explorerAddress,
  explorerTx,
} from "@/lib/roach/constants";
import { addressToBytes, bcsU64, normalizeHex } from "@/lib/roach/bcs";
import { sendVaultEntry } from "@/lib/roach/tx";
import {
  formatCountdown,
  formatUnlockTime,
  toOnChainAmount,
  type StakeView,
} from "@/lib/roach/vault";
import {
  connectStarKeyWallet,
  friendlyTxError,
  getStarKey,
  txHashFromResult,
} from "@/lib/roach/wallet";
import { formatBalance, shortAddr } from "@/lib/utils";

type Props = {
  address: string | null;
  source: "starkey" | "demo" | null;
};

function sameAddr(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  return normalizeHex(a).replace(/^0+/, "") === normalizeHex(b).replace(/^0+/, "");
}

export function LockVault({ address, source }: Props) {
  const [totalLocked, setTotalLocked] = useState(0n);
  const [paused, setPaused] = useState(false);
  const [admin, setAdmin] = useState<string | null>(VAULT_ADMIN);
  const [stakes, setStakes] = useState<StakeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("1");
  const [days, setDays] = useState(7);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emergAmount, setEmergAmount] = useState("");
  const [emergTo, setEmergTo] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isAdmin = sameAddr(address, admin);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const qs = address ? `?user=${encodeURIComponent(address)}` : "";
      const res = await fetch(`/api/vault${qs}`);
      if (!res.ok) throw new Error("vault");
      const data = (await res.json()) as {
        totalLocked: string;
        paused: boolean;
        admin: string | null;
        stakes: {
          id: number;
          amount: string;
          unlockTime: number;
          duration: number;
          unlocked: boolean;
          secondsLeft: number;
        }[];
      };
      setTotalLocked(BigInt(data.totalLocked || 0));
      setPaused(Boolean(data.paused));
      if (data.admin) setAdmin(data.admin);
      setStakes(
        (data.stakes ?? []).map((s) => ({
          ...s,
          amount: BigInt(s.amount),
        })),
      );
    } catch {
      /* keep last known */
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 20_000);
    return () => clearInterval(t);
  }, [refresh]);

  const run = async (
    fn: string,
    args: Uint8Array[],
    ok: string,
    demoApply?: () => void,
  ) => {
    setPending(fn);
    setError(null);
    setSuccess(null);
    setTxHash(null);
    try {
      let provider = source === "starkey" ? getStarKey() : null;
      let sender = address;
      if (!provider) {
        if (!getStarKey()) {
          await new Promise((r) => setTimeout(r, 700));
          demoApply?.();
          setSuccess(`${ok} (preview — connect StarKey on Testnet to send)`);
          return;
        }
        const linked = await connectStarKeyWallet(VAULT_TESTNET_CHAIN_ID);
        provider = linked.provider;
        sender = linked.address;
        if (!sameAddr(sender, address)) {
          throw new Error(
            `Connect ${shortAddr(address || VAULT_ADMIN)} in StarKey on Testnet to send on-chain`,
          );
        }
      }
      if (!provider || !sender) throw new Error("Connect StarKey first.");
      const result = await sendVaultEntry(provider, sender, fn, args);
      const hash = txHashFromResult(result);
      setTxHash(hash);
      setSuccess(ok);
      setTimeout(() => void refresh(), 2800);
    } catch (e) {
      setError(friendlyTxError(e));
    } finally {
      setPending(null);
    }
  };

  const handleStake = async () => {
    const amt = toOnChainAmount(amount);
    if (amt <= 0n) {
      setError("Enter a valid amount");
      return;
    }
    if (paused) {
      setError("Vault is paused — new stakes are temporarily disabled");
      return;
    }
    await run(
      "stake",
      [bcsU64(amt), bcsU64(days)],
      `Staked ${amount} SUPRA for ${days} days`,
      () => {
        const now = Math.floor(Date.now() / 1000);
        const duration = days * 86400;
        const nextId = (stakes.at(-1)?.id ?? 0) + 1;
        setStakes((prev) => [
          ...prev,
          {
            id: nextId,
            amount: amt,
            unlockTime: now + duration,
            duration,
            unlocked: false,
            secondsLeft: duration,
          },
        ]);
        setTotalLocked((t) => t + amt);
      },
    );
  };

  const handleEmergency = async () => {
    const amt = toOnChainAmount(emergAmount);
    if (amt <= 0n) {
      setError("Enter a valid emergency amount");
      return;
    }
    if (!emergTo || emergTo.length < 10) {
      setError("Enter a valid recipient address");
      return;
    }
    await run(
      "emergency_withdraw",
      [bcsU64(amt), addressToBytes(emergTo)],
      `Emergency withdraw of ${emergAmount} SUPRA → ${shortAddr(emergTo)}`,
      () => {
        setTotalLocked((t) => (t > amt ? t - amt : 0n));
      },
    );
  };

  const handleUnstake = async (s: StakeView) => {
    if (!s.unlocked) {
      setError("This stake is still locked — wait until the unlock time");
      return;
    }
    await run(
      "unstake",
      [bcsU64(s.id)],
      `Unstaked #${s.id} · ${formatBalance(s.amount)} SUPRA returned`,
      () => {
        setStakes((prev) => prev.filter((x) => x.id !== s.id));
        setTotalLocked((t) => (t > s.amount ? t - s.amount : 0n));
      },
    );
  };

  return (
    <section className="roach-panel p-5 sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="roach-eyebrow mb-1 text-accent">Testnet · Phase 2</p>
          <h2 className="font-display text-4xl tracking-wide text-fg">Lock Vault</h2>
          <p className="mt-1 text-sm text-muted">
            Multi-stake vault. StarKey Testnet (chain 6).
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => void refresh()}
          aria-label="Refresh vault"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        </Button>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-raised px-3 py-2.5 shadow-[var(--shadow-border)]">
          <p className="roach-eyebrow">Total locked</p>
          <p className="font-mono text-sm font-medium tabular-nums text-accent">
            {formatBalance(totalLocked)} SUPRA
          </p>
        </div>
        <div className="rounded-xl bg-raised px-3 py-2.5 shadow-[var(--shadow-border)]">
          <p className="roach-eyebrow">Status</p>
          <p
            className={`font-mono text-sm font-medium ${paused ? "text-danger" : "text-accent"}`}
          >
            {paused ? "Paused" : "Active"}
          </p>
        </div>
        <div className="rounded-xl bg-raised px-3 py-2.5 shadow-[var(--shadow-border)]">
          <p className="roach-eyebrow">Your positions</p>
          <p className="font-mono text-sm font-medium tabular-nums text-fg">
            {stakes.length}
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-raised px-3 py-2 text-sm text-danger shadow-[var(--shadow-border)]">
          {error}
        </p>
      )}
      {success && (
        <div className="mb-3 rounded-xl bg-raised px-3 py-2 text-sm text-accent shadow-[var(--shadow-border)]">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {success}
          </p>
          {txHash && (
            <a
              href={explorerTx(txHash, true)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex text-xs hover:underline"
            >
              View on Suprascan
            </a>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="roach-eyebrow">
          Amount (SUPRA)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="roach-input mt-2"
          />
        </label>
        <label className="roach-eyebrow">
          Lock duration
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="roach-input mt-2"
          >
            {VAULT_DURATIONS.map((d) => (
              <option key={d.days} value={d.days}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button
        className="mb-5 w-full"
        disabled={!!pending || paused || !address}
        onClick={() => void handleStake()}
      >
        {pending === "stake" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Lock className="size-4" />
        )}
        Stake SUPRA
      </Button>

      <p className="roach-eyebrow mb-2">Your stakes</p>
      {stakes.length === 0 ? (
        <p className="mb-4 rounded-xl bg-raised px-3 py-4 text-center text-sm text-muted shadow-[var(--shadow-border)]">
          {address
            ? "No active stakes. Lock some SUPRA above."
            : "Connect to view positions"}
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {stakes.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-raised px-3 py-3 shadow-[var(--shadow-border)]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium tabular-nums text-fg">
                    {formatBalance(s.amount)} SUPRA
                  </p>
                  <span className="text-xs text-muted">#{s.id}</span>
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-mono text-xs tracking-[0.14em] uppercase ${
                      s.unlocked
                        ? "bg-accent/15 text-accent"
                        : "bg-raised text-muted"
                    }`}
                  >
                    {s.unlocked ? "Unlocked" : formatCountdown(s.secondsLeft)}
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Unlock {formatUnlockTime(s.unlockTime)} ·{" "}
                  {Math.round(s.duration / 86400)}d lock
                </p>
              </div>
              <Button
                size="sm"
                variant={s.unlocked ? "default" : "secondary"}
                disabled={!s.unlocked || !!pending}
                onClick={() => void handleUnstake(s)}
              >
                {pending === "unstake" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Unlock className="size-4" />
                )}
                Unstake
              </Button>
            </li>
          ))}
        </ul>
      )}
      {stakes.some((s) => s.unlocked) && source !== "starkey" && (
        <p className="mb-4 text-[11px] text-muted">
          Unstake opens StarKey on Testnet (chain 6) and returns SUPRA on-chain.
          Preview-only if the extension is missing.
        </p>
      )}

      <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Shield className="size-4 text-danger" />
          <h3 className="font-display text-2xl tracking-wide text-fg">Admin</h3>
          {isAdmin ? (
            <span className="rounded-sm bg-danger/15 px-1.5 py-0.5 font-mono text-xs tracking-[0.14em] uppercase text-danger">
              Signed in as admin
            </span>
          ) : (
            <span className="font-mono text-xs text-muted">
              Connect {shortAddr(admin || VAULT_ADMIN)} in StarKey to enable
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={!isAdmin || !!pending}
            onClick={() =>
              void run("pause", [], "Vault paused", () => setPaused(true))
            }
          >
            <Pause className="size-3" />
            Pause vault
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!isAdmin || !!pending}
            onClick={() =>
              void run("unpause", [], "Vault unpaused", () => setPaused(false))
            }
          >
            <Play className="size-3" />
            Unpause
          </Button>
        </div>
        {!isAdmin ? (
          <p className="mt-2 flex items-start gap-1 text-[11px] text-muted">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            Emergency withdraw stays hidden until the admin wallet is connected.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-muted">
              Pull locked SUPRA to any address. Admin only.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={emergAmount}
                onChange={(e) => setEmergAmount(e.target.value)}
                placeholder="Amount (SUPRA)"
                className="roach-input"
              />
              <input
                value={emergTo}
                onChange={(e) => setEmergTo(e.target.value)}
                placeholder="Recipient 0x…"
                className="roach-input"
              />
            </div>
            <Button
              size="sm"
              variant="burn"
              disabled={!!pending}
              onClick={() => void handleEmergency()}
            >
              Emergency withdraw
            </Button>
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted">
        Resource{" "}
        <a
          href={explorerAddress(VAULT_RESOURCE_ACCOUNT, true)}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          {shortAddr(VAULT_RESOURCE_ACCOUNT)}
        </a>{" "}
        · Module {shortAddr(VAULT_MODULE_ADDRESS)}
      </p>
    </section>
  );
}
