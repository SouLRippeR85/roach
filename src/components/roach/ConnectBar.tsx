import { Button } from "@/components/ui/button";
import { GUNK_ARCADE_URL } from "@/lib/roach/constants";
import { shortAddr } from "@/lib/utils";
import type { WalletSource } from "@/lib/roach/types";

type Props = {
  address: string | null;
  source: WalletSource | null;
  connecting?: boolean;
  onDemo: () => void;
  onStarKey: () => void;
  onDisconnect: () => void;
};

export function ConnectBar({
  address,
  source,
  connecting,
  onDemo,
  onStarKey,
  onDisconnect,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {address ? (
        <span className="inline-flex h-11 max-w-full min-w-0 items-center gap-2 rounded-md bg-raised px-3 font-mono text-sm tabular-nums text-fg shadow-[var(--shadow-border)]">
          <span className="min-w-0 truncate">{shortAddr(address, 6, 4)}</span>
          <span
            className={`shrink-0 text-xs tracking-[0.14em] uppercase ${
              source === "starkey" ? "text-accent" : "text-faint"
            }`}
          >
            {source === "demo" ? "Paper" : "Live"}
          </span>
        </span>
      ) : null}

      {(!address || source === "demo") && (
        <Button size="sm" onClick={onStarKey} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect StarKey"}
        </Button>
      )}

      {!address && (
        <Button size="sm" variant="ghost" onClick={onDemo}>
          Colony preview
        </Button>
      )}

      <a
        href={GUNK_ARCADE_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center rounded-sm px-3 text-sm font-medium text-fg shadow-[var(--shadow-border)] transition-shadow duration-[var(--motion-quick)] hover:shadow-[var(--shadow-border-hover)]"
      >
        Play GUNK
      </a>

      {address && (
        <Button size="sm" variant="ghost" onClick={onDisconnect}>
          Drop
        </Button>
      )}
    </div>
  );
}
