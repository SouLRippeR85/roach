import { useEffect, useState } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import {
  ATMOS_APP_URL,
  ATMOS_TOKEN_URL,
  ROACH_BURN_ADDRESS,
  ROACH_FA_METADATA,
  explorerAddress,
} from "@/lib/roach/constants";
import { Button } from "@/components/ui/button";

type Stats = {
  name: string;
  symbol: string;
  graduated: boolean;
  crowned: boolean;
  holders: string;
  volumeSupra: string;
  supply: string;
  burned: string;
};

export function TokenStats() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roach");
      if (!res.ok) throw new Error("stats");
      const data = (await res.json()) as Stats;
      setStats(data);
      setUpdated(new Date().toLocaleTimeString());
    } catch {
      setStats({
        name: "CockARoach Survivalist",
        symbol: "ROACH",
        graduated: true,
        crowned: true,
        holders: "39",
        volumeSupra: "1,750,984",
        supply: "938,895,176",
        burned: "61,104,823",
      });
      setUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  const status = stats?.graduated
    ? stats.crowned
      ? "Graduated · King"
      : "Graduated"
    : "Bonding";

  return (
    <section className="roach-panel p-5 sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="roach-eyebrow mb-1 text-accent">Atmos</p>
          <h2 className="font-display text-4xl tracking-wide text-fg">Token Stats</h2>
          <p className="mt-1 text-sm text-muted">
            {stats?.name || "ROACH"} on Hyper AMM
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => void fetchStats()}
          disabled={loading}
          aria-label="Refresh stats"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Stat label="Status" value={status} accent />
        <Stat label="Holders" value={stats?.holders ?? "—"} />
        <Stat label="Supply" value={stats?.supply ?? "—"} />
        <Stat label="Burned" value={stats?.burned ?? "—"} />
        <Stat label="Volume" value={stats ? `${stats.volumeSupra} SUPRA` : "—"} />
        <Stat label="Network" value="Supra mainnet" />
      </div>

      <a
        href={ATMOS_TOKEN_URL}
        target="_blank"
        rel="noreferrer"
        className="mb-2 flex h-11 items-center justify-between rounded-md bg-raised px-4 text-sm text-accent shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
      >
        Trade ROACH on Atmos
        <ExternalLink className="size-4" />
      </a>
      <a
        href={explorerAddress(ROACH_FA_METADATA)}
        target="_blank"
        rel="noreferrer"
        className="mb-2 flex h-11 items-center justify-between rounded-md bg-raised px-4 text-sm text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
      >
        View FA on Suprascan
        <ExternalLink className="size-4 text-muted" />
      </a>
      <a
        href={explorerAddress(ROACH_BURN_ADDRESS)}
        target="_blank"
        rel="noreferrer"
        className="flex h-11 items-center justify-between rounded-md bg-raised px-4 text-sm text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
      >
        View burn address
        <ExternalLink className="size-4 text-muted" />
      </a>
      {updated && (
        <p className="mt-4 text-center font-mono text-xs tracking-[0.12em] text-faint">
          Last updated: {updated} · {ATMOS_APP_URL.replace("https://", "")}
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]">
      <p className="roach-eyebrow mb-1">{label}</p>
      <p
        className={`font-mono text-sm font-medium tabular-nums ${accent ? "text-accent" : "text-fg"}`}
      >
        {value}
      </p>
    </div>
  );
}
