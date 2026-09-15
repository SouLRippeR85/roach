import {
  ETHEREUM_CHAIN_ID,
  FRAMEWORK_ADDR,
  ROACH_BURN_ADDRESS,
  SUPRA_MAINNET_CHAIN_ID,
  TOKEN_BRIDGE_ACCOUNT,
  VAULT_MODULE_ADDRESS,
  VAULT_MODULE_NAME,
  VAULT_TESTNET_CHAIN_ID,
} from "./constants";
import {
  addressToBytes,
  bcsBool,
  bcsBytes,
  bcsU64,
  evmAddressToBytes,
  normalizeHex,
} from "./bcs";
import { ensureChain, type StarKeyProvider } from "./wallet";
import type { ChainNet } from "./types";

function expiry() {
  return { txExpiryTime: Math.ceil(Date.now() / 1000) + 60 };
}

export async function sendNativeOrCoins(
  provider: StarKeyProvider,
  sender: string,
  coinType: string,
  amount: bigint,
  nativeSupra: boolean,
  network: ChainNet = "mainnet",
) {
  await ensureChain(
    provider,
    network === "testnet" ? VAULT_TESTNET_CHAIN_ID : SUPRA_MAINNET_CHAIN_ID,
  );
  const recipientBytes = addressToBytes(ROACH_BURN_ADDRESS);
  const amountBytes = bcsU64(amount);
  const payload = nativeSupra
    ? [
        sender,
        0,
        FRAMEWORK_ADDR,
        "supra_account",
        "transfer",
        [],
        [recipientBytes, amountBytes],
        expiry(),
      ]
    : [
        sender,
        0,
        FRAMEWORK_ADDR,
        "supra_account",
        "transfer_coins",
        [coinType],
        [recipientBytes, amountBytes],
        expiry(),
      ];
  const data = await provider.createRawTransactionData(payload);
  if (!data) throw new Error("StarKey returned empty transaction data");
  return provider.sendTransaction({ data });
}

/**
 * Phase B — reverse bridge.
 * 0xda20…::token_bridge_service::send_tokens<CoinType>(
 *   to_chain_id, token_address, should_unwrap, amount, receiver, payload)
 */
export async function sendTokensHome(
  provider: StarKeyProvider,
  sender: string,
  coinType: string,
  tokenAddress: string,
  amount: bigint,
  evmReceiver: string,
  shouldUnwrap: boolean,
) {
  await ensureChain(provider, SUPRA_MAINNET_CHAIN_ID);
  const moduleAddr = normalizeHex(TOKEN_BRIDGE_ACCOUNT).padStart(64, "0");
  const args = [
    bcsU64(ETHEREUM_CHAIN_ID),
    addressToBytes(tokenAddress),
    bcsBool(shouldUnwrap),
    bcsU64(amount),
    bcsBytes(evmAddressToBytes(evmReceiver)),
    bcsBytes(new Uint8Array(0)),
  ];
  const payload = [
    sender,
    0,
    moduleAddr,
    "token_bridge_service",
    "send_tokens",
    [coinType],
    args,
    expiry(),
  ];
  const data = await provider.createRawTransactionData(payload);
  if (!data) throw new Error("StarKey returned empty transaction data");
  return provider.sendTransaction({ data });
}

export async function sendVaultEntry(
  provider: StarKeyProvider,
  sender: string,
  functionName: string,
  args: Uint8Array[],
) {
  await ensureChain(provider, VAULT_TESTNET_CHAIN_ID);
  const moduleAddr = normalizeHex(VAULT_MODULE_ADDRESS).padStart(64, "0");
  const payload = [
    sender,
    0,
    moduleAddr,
    VAULT_MODULE_NAME,
    functionName,
    [],
    args,
    expiry(),
  ];
  const data = await provider.createRawTransactionData(payload);
  if (!data) throw new Error("StarKey returned empty transaction data");
  return provider.sendTransaction({ data });
}
