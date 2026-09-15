import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(addr: string, head = 6, tail = 4) {
  if (!addr) return "";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function formatBalance(raw: bigint, decimals = 8): string {
  const str = raw.toString().padStart(decimals + 1, "0");
  const whole = str.slice(0, -decimals) || "0";
  const fraction = str.slice(-decimals).replace(/0+$/, "");
  return fraction
    ? `${Number(whole).toLocaleString()}.${fraction}`
    : Number(whole).toLocaleString();
}

export function formatUsd(value: number): string {
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
