import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { ConnectBar } from "@/components/roach/ConnectBar";
import { DustCleaner } from "@/components/roach/DustCleaner";
import { Drips, RoachMark } from "@/components/roach/RoachMark";
import { TokenStats } from "@/components/roach/TokenStats";
import { LockVault } from "@/components/roach/LockVault";
import {
  GUNK_ARCADE_URL,
  ROACH_BURN_ADDRESS,
  ROACH_FA_METADATA,
  STARKEY_INSTALL_URL,
  explorerAddress,
} from "@/lib/roach/constants";
import { DEMO_ADDRESS } from "@/lib/roach/demo";
import {
  connectStarKeyWallet,
  friendlyTxError,
  inIframe,
  pickAddress,
} from "@/lib/roach/wallet";
import type { WalletSource } from "@/lib/roach/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [address, setAddress] = useState<string | null>(DEMO_ADDRESS);
  const [source, setSource] = useState<WalletSource | null>("demo");
  const [price, setPrice] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [framed, setFramed] = useState(false);

  useEffect(() => {
    setFramed(inIframe());
    const load = async () => {
      try {
        const res = await fetch("/api/supra-price");
        if (!res.ok) throw new Error("price");
        const data = await res.json();
        if (data?.usd) setPrice(Number(data.usd));
        else setPrice(0.000192);
      } catch {
        setPrice(0.000192);
      }
    };
    void load();
  }, []);

  const connectStarKey = async () => {
    setConnecting(true);
    setWalletError(null);
    try {
      const { provider, address: addr } = await connectStarKeyWallet();
      setAddress(addr);
      setSource("starkey");
      provider.on?.("accountChanged", (accs) => {
        const a = pickAddress(accs);
        if (a) {
          setAddress(a);
          setSource("starkey");
        }
      });
    } catch (e) {
      setWalletError(friendlyTxError(e));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-bg text-fg">
      <Drips />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <RoachMark className="size-10 text-accent sm:size-12" />
            <div>
              <p className="roach-eyebrow text-accent">ROACH arcade</p>
              <h1 className="font-display text-3xl leading-none tracking-wide text-fg sm:text-4xl">
                CLEANER
              </h1>
            </div>
          </div>
          <ConnectBar
            address={address}
            source={source}
            connecting={connecting}
            onDemo={() => {
              setWalletError(null);
              setAddress(DEMO_ADDRESS);
              setSource("demo");
            }}
            onStarKey={() => void connectStarKey()}
            onDisconnect={() => {
              setAddress(null);
              setSource(null);
              setWalletError(null);
            }}
          />
        </header>

        {framed && (
          <p className="mb-6 rounded-xl bg-raised px-4 py-3 text-sm text-muted shadow-[var(--shadow-border)]">
            StarKey cannot inject into this nested window. Open the live site in
            a full tab, then connect.
          </p>
        )}
        {walletError && (
          <p className="mb-6 rounded-xl bg-raised px-4 py-3 text-sm text-danger shadow-[var(--shadow-border)]">
            {walletError}{" "}
            <a
              href={STARKEY_INSTALL_URL}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              Get StarKey
            </a>
          </p>
        )}

        <section className="roach-stagger mb-10 max-w-xl">
          <p className="roach-eyebrow mb-3 text-accent">Utilities</p>
          <h2 className="font-display text-6xl leading-none tracking-wide text-fg sm:text-7xl">
            Survive. Adapt.{" "}
            <span className="text-accent">Multiply.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted sm:text-base">
            Burn leftover coins, send bridged assets home, lock value. Graduated
            $ROACH is never dust. Same pit as GUNK.
          </p>
          <a
            href={GUNK_ARCADE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-11 items-center text-sm font-medium text-accent"
          >
            Enter the pit — Play GUNK
          </a>
        </section>

        <section className="mb-8 grid gap-6 md:grid-cols-2 min-w-0">
          {address && source ? (
            <DustCleaner
              address={address}
              source={source}
              supraPrice={price}
            />
          ) : (
            <section className="roach-panel flex min-h-72 items-center justify-center p-6 text-center text-sm text-muted">
              Connect StarKey or open the colony preview to scan.
            </section>
          )}
          <TokenStats />
        </section>

        <section className="mb-8">
          <LockVault address={address} source={source} />
        </section>

        <section className="roach-panel p-6">
          <p className="roach-eyebrow mb-5">Contracts</p>
          <AddrRow label="ROACH FA" value={ROACH_FA_METADATA} />
          <div className="h-4" />
          <AddrRow label="Burn address" value={ROACH_BURN_ADDRESS} danger />
        </section>

        <footer className="mt-16 border-t border-border pt-8 text-center font-mono text-xs tracking-[0.16em] text-faint uppercase">
          Built for the colony · Graduated on Atmos · Same table as GUNK
        </footer>
      </div>
    </main>
  );
}

function AddrRow({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="roach-eyebrow mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <code
          className={`min-w-0 flex-1 break-all rounded-md bg-raised px-3 py-2 font-mono text-xs sm:text-sm ${danger ? "text-danger" : "text-accent"}`}
        >
          {value}
        </code>
        <a
          href={explorerAddress(value)}
          target="_blank"
          rel="noreferrer"
          className="flex size-11 items-center justify-center rounded-md bg-raised shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
          aria-label={`Open ${label} on Suprascan`}
        >
          <ExternalLink className="size-4 text-muted" />
        </a>
      </div>
    </div>
  );
}
