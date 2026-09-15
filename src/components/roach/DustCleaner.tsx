import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Flame,
  Loader2,
  Shield,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ATMOS_TOKEN_URL,
  ROACH_BURN_ADDRESS,
  SUPRANOVA_URL,
  TEST_SUPRA,
  explorerTx,
} from "@/lib/roach/constants";
import { demoTokens } from "@/lib/roach/demo";
import { sendNativeOrCoins } from "@/lib/roach/tx";
import type { DustToken } from "@/lib/roach/types";
import {
  friendlyTxError,
  getStarKey,
  txHashFromResult,
} from "@/lib/roach/wallet";
import { formatBalance, shortAddr } from "@/lib/utils";
import { SendHome } from "./SendHome";

type Props = {
  address: string;
  source: "starkey" | "demo";
  supraPrice: number | null;
};

export function DustCleaner({ address, source, supraPrice }: Props) {
  const [scanning, setScanning] = useState(false);
  const [tokens, setTokens] = useState<DustToken[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [burning, setBurning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txNet, setTxNet] = useState<boolean>(false);
  const [burnMode, setBurnMode] = useState<"test" | "full">("test");
  const [confirmFull, setConfirmFull] = useState(false);
  const [homeId, setHomeId] = useState<string | null>(null);

  const loadDemo = () => {
    const found = demoTokens(supraPrice);
    setTokens(found);
    setSelected(found.filter((t) => t.kind === "dust").map((t) => t.id));
    setBurnMode("test");
    setConfirmFull(false);
  };

  const applyTokens = (found: DustToken[]) => {
    found.sort(
      (a, b) =>
        ({ dust: 0, supra: 1, bridged: 2, keep: 3 }[a.kind] -
          { dust: 0, supra: 1, bridged: 2, keep: 3 }[b.kind]),
    );
    setTokens(found);
    setSelected(found.filter((t) => t.kind === "dust").map((t) => t.id));
    setBurnMode("test");
    setConfirmFull(false);
  };

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);
    setTxNet(false);
    setHomeId(null);

    try {
      const qs = new URLSearchParams({ address });
      if (supraPrice) qs.set("price", String(supraPrice));
      const res = await fetch(`/api/scan?${qs}`);
      if (!res.ok) throw new Error("scan failed");
      const data = (await res.json()) as {
        tokens: (Omit<DustToken, "rawValue"> & { rawValue: string })[];
      };
      const found: DustToken[] = (data.tokens ?? []).map((t) => ({
        ...t,
        rawValue: BigInt(t.rawValue),
      }));
      if (found.length === 0) {
        if (source === "demo") loadDemo();
        else setTokens([]);
        return;
      }
      applyTokens(found);
    } catch (e) {
      console.warn(e);
      if (source === "demo") {
        setError("Live scan unavailable — loaded colony preview holdings.");
        loadDemo();
      } else {
        setError("Could not scan this account. Try again in a moment.");
      }
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    void handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, source]);

  const selectedTokens = tokens.filter((t) => selected.includes(t.id));
  const selectedDust = selectedTokens.filter((t) => t.kind === "dust");
  const selectedSupra = selectedTokens.find((t) => t.kind === "supra");
  const dustTokens = tokens.filter((t) => t.kind === "dust");
  const bridgedTokens = tokens.filter((t) => t.kind === "bridged");
  const supraTokens = tokens.filter((t) => t.kind === "supra");
  const keepTokens = tokens.filter((t) => t.kind === "keep");

  const needsFull = Boolean(selectedSupra && burnMode === "full");
  const canBurn =
    selectedTokens.filter((t) => t.kind === "dust" || t.kind === "supra")
      .length > 0 &&
    !burning &&
    (!needsFull || confirmFull);

  const toggle = (t: DustToken) => {
    if (t.kind !== "dust" && t.kind !== "supra") return;
    setSelected((prev) =>
      prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id],
    );
  };

  const handleBurn = async () => {
    if (!canBurn) return;
    setBurning(true);
    setError(null);
    setSuccess(null);
    setProgress(null);

    const jobs: { token: DustToken; amount: bigint; native: boolean }[] = [];
    for (const token of selectedDust) {
      jobs.push({ token, amount: token.rawValue, native: false });
    }
    const selectedSupras = selectedTokens.filter((t) => t.kind === "supra");
    for (const token of selectedSupras) {
      const amount =
        burnMode === "test"
          ? TEST_SUPRA < token.rawValue
            ? TEST_SUPRA
            : token.rawValue
          : token.rawValue;
      if (amount > 0n) jobs.push({ token, amount, native: true });
    }
    if (jobs.length === 0) {
      setError("Nothing to clean — select dust, or a small SUPRA test.");
      setBurning(false);
      return;
    }

    try {
      if (source === "demo") {
        for (let i = 0; i < jobs.length; i++) {
          setProgress(`Cleaning ${i + 1} of ${jobs.length} — ${jobs[i].token.symbol}`);
          await new Promise((r) => setTimeout(r, 700));
        }
        setSuccess(
          jobs.length === 1
            ? `Preview: ${jobs[0].token.symbol} would go to the burn address`
            : `Preview: ${jobs.length} transfers would go to the burn address`,
        );
        setTokens((prev) =>
          prev
            .map((t) => {
              const job = jobs.find((j) => j.token.id === t.id);
              if (!job) return t;
              if (job.native && burnMode === "test") {
                const next = t.rawValue - job.amount;
                return {
                  ...t,
                  rawValue: next,
                  balance: formatBalance(next, t.decimals),
                };
              }
              return { ...t, rawValue: 0n, balance: "0" };
            })
            .filter((t) => t.rawValue > 0n || t.kind !== "dust"),
        );
        setSelected([]);
        return;
      }

      const provider = getStarKey();
      if (!provider) throw new Error("StarKey not found");
      let lastHash: string | null = null;
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        setProgress(`Cleaning ${i + 1} of ${jobs.length} — ${job.token.symbol}`);
        const result = await sendNativeOrCoins(
          provider,
          address,
          job.token.coinType,
          job.amount,
          job.native,
          job.token.network,
        );
        lastHash = txHashFromResult(result) || lastHash;
        setTxNet(job.token.network === "testnet");
      }
      setTxHash(lastHash);
      setSuccess(
        jobs.length === 1
          ? `Sent ${jobs[0].token.symbol} to the ROACH burn address`
          : `Sent ${jobs.length} transfers to the ROACH burn address`,
      );
      setTimeout(() => void handleScan(), 2800);
    } catch (e) {
      setError(friendlyTxError(e));
    } finally {
      setBurning(false);
      setProgress(null);
    }
  };

  const burnLabel = useMemo(() => {
    if (burning) return progress || "Cleaning…";
    const parts: string[] = [];
    if (selectedDust.length > 0) {
      parts.push(
        selectedDust.length === 1
          ? `Clean ${selectedDust[0].symbol}`
          : `Clean ${selectedDust.length} dust`,
      );
    }
    if (selectedSupra) {
      parts.push(burnMode === "test" ? "Burn 0.1 SUPRA" : "Burn full SUPRA");
    }
    return parts.length ? `${parts.join(" + ")} → burn` : "Select dust to clean";
  }, [burning, progress, selectedDust, selectedSupra, burnMode]);

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-elevated p-5 sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-danger/25 bg-danger/10">
          <Trash2 className="size-5 text-danger" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-fg">Dust Cleaner</h2>
          <p className="text-xs text-muted">
            Graduated ROACH is never dust · burn junk · send bridged home
            {source === "demo" ? " · colony preview" : " · StarKey"}
            {supraPrice ? ` · SUPRA ≈ $${supraPrice.toFixed(6)}` : ""}
          </p>
        </div>
      </header>

      <p className="mb-3 truncate font-mono text-xs text-muted">{address}</p>

      <Button
        variant="secondary"
        className="w-full"
        disabled={scanning || burning}
        onClick={() => void handleScan()}
      >
        {scanning ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Scanning…
          </>
        ) : (
          "Scan account"
        )}
      </Button>

      {error && (
        <p className="mt-3 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {success && (
        <div className="mt-3 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-sm text-accent">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {success}
          </p>
          {txHash && (
            <a
              href={explorerTx(txHash, txNet)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              View on Suprascan
              <ArrowUpRight className="size-3" />
            </a>
          )}
        </div>
      )}

      {scanning && tokens.length === 0 && (
        <div className="mt-5 space-y-2">
          <div className="h-16 animate-pulse rounded-xl border border-border bg-subtle" />
          <div className="h-16 animate-pulse rounded-xl border border-border bg-subtle" />
          <p className="text-center text-[11px] text-muted">
            Scanning Testnet + mainnet…
          </p>
        </div>
      )}

      {tokens.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Chip>{tokens.length} coins</Chip>
            {dustTokens.length > 0 && (
              <Chip tone="danger">{dustTokens.length} dust</Chip>
            )}
            {bridgedTokens.length > 0 && (
              <Chip tone="sky">{bridgedTokens.length} bridged</Chip>
            )}
            {supraTokens.length > 0 && <Chip tone="accent">SUPRA</Chip>}
            {keepTokens.length > 0 && <Chip tone="accent">ROACH keep</Chip>}
          </div>
          <p className="text-xs text-muted">
            {dustTokens.length > 0
              ? `${dustTokens.length} dust selected. ROACH and SUPRA stay protected. Bridged assets never burn.`
              : "No dust found. Graduated ROACH is never treated as dust."}
          </p>

          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {dustTokens.map((t) => (
              <TokenRow
                key={t.id}
                token={t}
                checked={selected.includes(t.id)}
                onToggle={() => toggle(t)}
              />
            ))}
            {supraTokens.map((t) => (
              <TokenRow
                key={t.id}
                token={t}
                checked={selected.includes(t.id)}
                onToggle={() => toggle(t)}
              />
            ))}
            {keepTokens.map((t) => (
              <li key={t.id}>
                <TokenRow token={t} checked={false} />
                <div className="mt-2 pl-8">
                  <a
                    href={ATMOS_TOKEN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center rounded-xl border border-accent/25 bg-accent/10 px-3 text-xs font-medium text-accent hover:bg-accent/15"
                  >
                    Trade ROACH on Atmos
                    <ArrowUpRight className="ml-1 size-3" />
                  </a>
                </div>
              </li>
            ))}
            {bridgedTokens.map((t) => (
              <li key={t.id}>
                <TokenRow token={t} checked={false} />
                <div className="mt-2 pl-8">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setHomeId((id) => (id === t.id ? null : t.id))
                    }
                  >
                    {homeId === t.id ? "Close" : "Send home"}
                  </Button>
                  {homeId === t.id && (
                    <SendHome
                      token={t}
                      address={address}
                      source={source}
                      onDone={(msg) => {
                        setSuccess(msg);
                        setHomeId(null);
                      }}
                      onError={setError}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          {selectedSupra && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={burnMode === "test" ? "default" : "secondary"}
                  onClick={() => {
                    setBurnMode("test");
                    setConfirmFull(false);
                  }}
                >
                  Test 0.1 SUPRA
                </Button>
                <Button
                  size="sm"
                  variant={burnMode === "full" ? "burn" : "secondary"}
                  onClick={() => setBurnMode("full")}
                >
                  Full amount
                </Button>
              </div>
              {burnMode === "full" && (
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={confirmFull}
                    onChange={(e) => setConfirmFull(e.target.checked)}
                  />
                  I understand this sends my entire SUPRA balance to{" "}
                  {shortAddr(ROACH_BURN_ADDRESS)} and cannot be undone.
                </label>
              )}
            </div>
          )}

          <Button
            variant="burn"
            className="w-full"
            disabled={!canBurn}
            onClick={() => void handleBurn()}
          >
            {burning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Flame className="size-4" />
            )}
            {burnLabel}
          </Button>
          <p className="text-center text-[11px] text-muted">
            Dust burns to the ROACH burn address. Graduated ROACH never burns
            here. Bridged assets use send_tokens, or{" "}
            <a
              href={SUPRANOVA_URL}
              className="text-muted underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              SupraNova
            </a>
            .
          </p>
        </div>
      )}
    </section>
  );
}

function Chip({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "danger" | "sky" | "accent";
}) {
  const cls =
    tone === "danger"
      ? "border-danger/25 bg-danger/10 text-danger"
      : tone === "sky"
        ? "border-sky/25 bg-sky/10 text-sky"
        : tone === "accent"
          ? "border-accent/25 bg-accent/10 text-accent"
          : "border-border bg-subtle text-muted";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function TokenRow({
  token,
  checked,
  onToggle,
}: {
  token: DustToken;
  checked: boolean;
  onToggle?: () => void;
}) {
  const selectable = token.kind === "dust" || token.kind === "supra";
  const badge =
    token.kind === "dust"
      ? "border-danger/25 bg-danger/10 text-danger"
      : token.kind === "bridged"
        ? "border-sky/25 bg-sky/10 text-sky"
        : token.kind === "keep"
          ? "border-accent/25 bg-accent/10 text-accent"
          : "border-border bg-subtle text-muted";
  const label =
    token.kind === "dust"
      ? "dust"
      : token.kind === "bridged"
        ? "bridged"
        : token.kind === "keep"
          ? "keep"
          : "native";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-bg/60 p-3">
      {selectable ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-1 size-4 accent-accent"
        />
      ) : (
        <Shield className="mt-1 size-4 shrink-0 text-muted" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-fg">{token.symbol}</p>
          {token.name && token.name !== token.symbol && (
            <p className="text-xs text-muted">{token.name}</p>
          )}
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${badge}`}
          >
            {label}
          </span>
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
              token.network === "testnet"
                ? "border-warn/30 bg-warn/10 text-warn"
                : "border-border bg-subtle text-muted"
            }`}
          >
            {token.network === "testnet" ? "test" : "main"}
          </span>
        </div>
        <p className="mt-1 break-all font-mono text-[11px] text-muted">
          {token.coinType}
        </p>
        <p className="mt-1 font-mono text-sm tabular-nums text-accent">
          {token.balance}
          {token.usdValue && (
            <span className="ml-2 text-xs text-muted">≈ {token.usdValue}</span>
          )}
        </p>
        {token.kind === "supra" && (
          <p className="mt-1 text-[11px] text-muted">
            Unchecked by default. Prefer the 0.1 SUPRA test.
          </p>
        )}
        {token.kind === "keep" && (
          <p className="mt-1 text-[11px] text-muted">
            Project token — never treated as dust.
          </p>
        )}
      </div>
    </div>
  );
}
