import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bug, Flame, ExternalLink } from "lucide-react";
import { ConnectBar } from "@/components/roach/ConnectBar";
import { DustCleaner } from "@/components/roach/DustCleaner";
import { TokenStats } from "@/components/roach/TokenStats";
import { LockVault } from "@/components/roach/LockVault";
import {
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
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
              <Bug className="size-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">ROACH</h1>
              <p className="text-xs text-muted">Supra · Atmos · Graduated</p>
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
          <p className="mb-6 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
            StarKey cannot inject into this preview frame. Open the live site in
            a full tab, then Connect StarKey.
          </p>
        )}
        {walletError && (
          <p className="mb-6 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
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

        <section className="mb-10 max-w-xl">
          <h2 className="mb-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Survive. Adapt.{" "}
            <span className="text-accent">Multiply.</span>
          </h2>
          <p className="text-lg text-muted">
            Clean leftover coins, send bridged assets home, lock value.
            Graduated ROACH is never dust.
          </p>
        </section>

        <section className="mb-8 grid gap-6 md:grid-cols-2 min-w-0">
          {address && source ? (
            <DustCleaner
              address={address}
              source={source}
              supraPrice={price}
            />
          ) : (
            <section className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-elevated p-6 text-center text-sm text-muted">
              Connect StarKey or open the colony preview to scan.
            </section>
          )}
          <TokenStats />
        </section>

        <section className="mb-8">
          <LockVault address={address} source={source} />
        </section>

        <section className="rounded-2xl border border-border bg-elevated/80 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Flame className="size-4 text-danger" />
            <h3 className="text-sm font-medium text-fg">Contract addresses</h3>
          </div>
          <AddrRow label="ROACH FA" value={ROACH_FA_METADATA} />
          <div className="h-4" />
          <AddrRow label="Burn address" value={ROACH_BURN_ADDRESS} danger />
        </section>

        <footer className="mt-16 border-t border-border pt-8 text-center text-xs text-muted">
          Built for the colony · Graduated on Atmos · Dust cleaner live
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
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      <div className="flex items-center gap-3">
        <code
          className={`min-w-0 flex-1 break-all rounded-lg border border-border bg-bg px-3 py-2 font-mono text-[11px] sm:text-sm ${danger ? "text-danger" : "text-accent"}`}
        >
          {value}
        </code>
        <a
          href={explorerAddress(value)}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-subtle p-2 hover:bg-elevated"
          aria-label={`Open ${label} on Suprascan`}
        >
          <ExternalLink className="size-4 text-muted" />
        </a>
      </div>
    </div>
  );
}
