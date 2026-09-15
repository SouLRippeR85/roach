import { Button } from "@/components/ui/button";
import { STARKEY_INSTALL_URL } from "@/lib/roach/constants";
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
  if (!address) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onStarKey} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect StarKey"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onDemo}>
          Colony preview
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-border bg-elevated px-3 py-2 font-mono text-xs text-fg">
        {shortAddr(address, 6, 4)}
        <span className="ml-2 text-muted">
          {source === "demo" ? "preview" : "StarKey"}
        </span>
      </span>
      {source === "demo" && (
        <Button size="sm" onClick={onStarKey} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect StarKey"}
        </Button>
      )}
      {source === "starkey" && (
        <a
          href={STARKEY_INSTALL_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-muted hover:underline"
        >
          Wallet
        </a>
      )}
      <Button size="sm" variant="ghost" onClick={onDisconnect}>
        Disconnect
      </Button>
    </div>
  );
}
