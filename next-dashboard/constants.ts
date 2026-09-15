export const SUPRA_MAINNET_RPC = "https://rpc-mainnet.supra.com";
export const SUPRA_TESTNET_RPC = "https://rpc-testnet.supra.com";
export const SUPRASCAN = "https://suprascan.io";
export const SUPRASCAN_TESTNET = "https://testnet.suprascan.io";

// ROACH Token Address (mainnet)
export const ROACH_TOKEN_ADDRESS =
  "0xce2af313fa1591edde3164ca99d82a4bea5b9e63f27afb043b317ae079659013";

// ROACH Burn Address
export const ROACH_BURN_ADDRESS =
  "0x618f29583128f1d58e391b77e40233eb2c19a3215fc24f2eebb2c657f3d37684";

// ─── Dust Cleaner – mainnet ───
export const SUPRANOVA_URL = "https://supranova.ai";

export const TOKEN_BRIDGE_ACCOUNT =
  "0xda20f7d0ec813c751926f06004a10bc6ee1eefc96798f6a1aa31447ee146f932";

export const TOKEN_BRIDGE_MODULE_NAME = "token_bridge_service";
export const TOKEN_BRIDGE_MODULE = `${TOKEN_BRIDGE_ACCOUNT}::${TOKEN_BRIDGE_MODULE_NAME}`;
export const TOKEN_BRIDGE_SEND_FN = "send_tokens";

/** Dummy CoinType for FA-backed wrapped assets. Native SUPRA uses SupraCoin. */
export const TOKEN_BRIDGE_PLACEHOLDER_COIN = "0x1::supra_coin::SupraCoin";

/** Destination chain id for Ethereum mainnet (SupraNova reverse bridge). */
export const ETHEREUM_CHAIN_ID = 1;
export const SUPRA_MAINNET_CHAIN_ID = "8";

export type BridgedAsset = {
  symbol: string;
  label: string;
  home: string;
  /** FA metadata object address on Supra mainnet */
  metadata: string;
  /**
   * Destination unwrap: true only when the home asset is native ETH.
   * ERC-20 homes (USDC, USDT, WBTC, SolvBTC) stay wrapped-false.
   */
  shouldUnwrap: boolean;
};

/** Known leftover coins treated as dust (mainnet). */
export const KNOWN_DUST_TOKENS: {
  symbol: string;
  name: string;
  match: string;
}[] = [
  {
    symbol: "CRED",
    name: "Repolia Credits",
    match: "cred_coin::cred",
  },
];

/** Wrapped assets minted by SupraNova (mainnet). Do not burn — send home. */
export const BRIDGED_ASSETS: BridgedAsset[] = [
  {
    symbol: "supETH",
    label: "supETH → ETH",
    home: "ETH",
    metadata:
      "0xe4af154ade9551e7f58a23b8f727ae2dca050f1b74582bb518ba361c889d246d",
    shouldUnwrap: true,
  },
  {
    symbol: "supUSDC",
    label: "supUSDC → USDC",
    home: "USDC",
    metadata:
      "0xf90b4b9d4a9d87c39fb3140513e52edc3ead5eaddcb9881b02becdeb63c5793d",
    shouldUnwrap: false,
  },
  {
    symbol: "supUSDT",
    label: "supUSDT → USDT",
    home: "USDT",
    metadata:
      "0x07b6463ca7a54ee37e113c8333db9c0af49de39555ee1cb44837db4c085f8964",
    shouldUnwrap: false,
  },
  {
    symbol: "supBTC",
    label: "supBTC → WBTC",
    home: "WBTC",
    metadata:
      "0x348b1a4fa68803cbda3b50326a90e59b21e80c3ced93588b20950b5c0697a67e",
    shouldUnwrap: false,
  },
  {
    symbol: "supSolvBTC",
    label: "supSolvBTC → SolvBTC",
    home: "SolvBTC",
    metadata:
      "0x224bee573e0ae84ba7f1eee4f7063a945ad7a268bea7ab9e004f6890177a480b",
    shouldUnwrap: false,
  },
];

export function bridgedAssetFor(symbolOrMeta: string): BridgedAsset | undefined {
  const key = symbolOrMeta.toLowerCase();
  const hex = key.startsWith("0x") ? key.slice(2) : key;
  return BRIDGED_ASSETS.find(
    (a) =>
      a.symbol.toLowerCase() === key ||
      a.metadata.toLowerCase() === key ||
      a.metadata.toLowerCase().replace(/^0x/, "") === hex
  );
}

// ─── Lock Vault – Phase 2 on Testnet ───
export const VAULT_MODULE_ADDRESS =
  "0x4f6d2a2b4135099e683690a8a0ec9feac34320f383d17082cf9f75875219ce4b";
export const VAULT_MODULE_NAME = "vault";
export const VAULT_RESOURCE_ACCOUNT =
  "0xab00b03b339ad718c541bc78943b4d7ad435a1f5a3e8a0bf90b971eca36c0f22";
export const VAULT_TESTNET_CHAIN_ID = "6";

export const VAULT_DURATIONS = [
  { days: 7, label: "7 Days" },
  { days: 30, label: "30 Days" },
  { days: 90, label: "90 Days" },
] as const;

export const DECIMALS = 8;

export const NETWORK =
  process.env.NEXT_PUBLIC_NETWORK === "mainnet" ? "mainnet" : "testnet";
