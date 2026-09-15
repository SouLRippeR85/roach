export function normalizeHex(addr: string): string {
  return (addr.startsWith("0x") ? addr.slice(2) : addr).toLowerCase();
}

export function addressToBytes(addr: string): Uint8Array {
  const hex = normalizeHex(addr);
  if (hex.length > 64 || !/^[0-9a-f]*$/.test(hex)) {
    throw new Error(`Invalid address: ${addr}`);
  }
  const padded = hex.padStart(64, "0");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bcsU64(value: bigint | number): Uint8Array {
  let v = typeof value === "bigint" ? value : BigInt(value);
  if (v < 0n || v > 0xffffffffffffffffn) {
    throw new Error(`u64 out of range: ${v}`);
  }
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

export function bcsBool(value: boolean): Uint8Array {
  return new Uint8Array([value ? 1 : 0]);
}

/** BCS vector<u8>: ULEB128 length + bytes. */
export function bcsBytes(data: Uint8Array): Uint8Array {
  const len = uleb128(data.length);
  const out = new Uint8Array(len.length + data.length);
  out.set(len, 0);
  out.set(data, len.length);
  return out;
}

export function evmAddressToBytes(addr: string): Uint8Array {
  const hex = normalizeHex(addr);
  if (hex.length !== 40 || !/^[0-9a-f]+$/.test(hex)) {
    throw new Error("Enter a 20-byte Ethereum address (0x + 40 hex)");
  }
  const out = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function uleb128(n: number): Uint8Array {
  const bytes: number[] = [];
  let v = n >>> 0;
  while (v >= 0x80) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v);
  return new Uint8Array(bytes);
}

export function isEvmAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr.trim());
}
