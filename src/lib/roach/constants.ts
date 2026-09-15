export const SUPRA_MAINNET_RPC = "https://rpc-mainnet.supra.com";
export const SUPRA_TESTNET_RPC = "https://rpc-testnet.supra.com";
export const SUPRASCAN = "https://suprascan.io";
export const SUPRASCAN_TESTNET = "https://testnet.suprascan.io";

/** SupraScan uses /address/:hex for wallets — /account/:hex/f 404s. */
export function explorerAddress(addr: string, testnet = false) {
  const base = testnet ? SUPRASCAN_TESTNET : SUPRASCAN;
  return `${base}/address/${addr}`;
}

export function explorerTx(hash: string, testnet = false) {
  const base = testnet ? SUPRASCAN_TESTNET : SUPRASCAN;
  return `${base}/tx/${hash}/f`;
}

export const ROACH_TOKEN_ADDRESS =
  "0xce2af313fa1591edde3164ca99d82a4bea5b9e63f27afb043b317ae079659013";

export const ROACH_BURN_ADDRESS =
  "0x618f29583128f1d58e391b77e40233eb2c19a3215fc24f2eebb2c657f3d37684";

/** Atmos Token Studio FA metadata (CockARoach Survivalist). */
export const ROACH_FA_METADATA =
  "0x868158dfec060b9976693ce4bfd6fefd4fd44c8b965a41b0b29e848c5c280532";
export const ROACH_FA_DECIMALS = 6;
export const ROACH_PUMP_POOL =
  "0xc29152da206a07b8f886c59536b8228497fd329de9d76c309a08ac98d3ecb77c";
export const ATMOS_PUMP_MODULE =
  "0xa4a4a31116e114bf3c4f4728914e6b43db73279a4421b0768993e07248fe2234";
export const ATMOS_APP_URL = "https://app.atmos.ag";
export const ATMOS_TOKEN_URL = `${ATMOS_APP_URL}/?token=${ROACH_PUMP_POOL}`;
export const STARKEY_INSTALL_URL = "https://starkey.app/";

export const SUPRANOVA_URL = "https://supranova.ai";

export const TOKEN_BRIDGE_ACCOUNT =
  "0xda20f7d0ec813c751926f06004a10bc6ee1eefc96798f6a1aa31447ee146f932";

export const TOKEN_BRIDGE_MODULE = `${TOKEN_BRIDGE_ACCOUNT}::token_bridge_service`;

/** Ethereum mainnet as used by SupraNova reverse bridge. */
export const ETHEREUM_CHAIN_ID = 1n;

export const FRAMEWORK_ADDR =
  "0000000000000000000000000000000000000000000000000000000000000001";

export const DECIMALS = 8;
export const TEST_SUPRA = 10_000_000n; // 0.1 SUPRA

export type BridgedAsset = {
  symbol: string;
  label: string;
  home: string;
  unwrapHome: string;
  metadata: string;
  decimals: number;
};

export const KNOWN_DUST_TOKENS: { symbol: string; name: string; match: string }[] =
  [{ symbol: "CRED", name: "Repolia Credits", match: "cred_coin::cred" }];

export const BRIDGED_ASSETS: BridgedAsset[] = [
  {
    symbol: "supETH",
    label: "supETH → ETH",
    home: "WETH",
    unwrapHome: "ETH",
    metadata:
      "0xe4af154ade9551e7f58a23b8f727ae2dca050f1b74582bb518ba361c889d246d",
    decimals: 18,
  },
  {
    symbol: "supUSDC",
    label: "supUSDC → USDC",
    home: "USDC",
    unwrapHome: "USDC",
    metadata:
      "0xf90b4b9d4a9d87c39fb3140513e52edc3ead5eaddcb9881b02becdeb63c5793d",
    decimals: 6,
  },
  {
    symbol: "supUSDT",
    label: "supUSDT → USDT",
    home: "USDT",
    unwrapHome: "USDT",
    metadata:
      "0x07b6463ca7a54ee37e113c8333db9c0af49de39555ee1cb44837db4c085f8964",
    decimals: 6,
  },
  {
    symbol: "supBTC",
    label: "supBTC → WBTC",
    home: "WBTC",
    unwrapHome: "WBTC",
    metadata:
      "0x348b1a4fa68803cbda3b50326a90e59b21e80c3ced93588b20950b5c0697a67e",
    decimals: 8,
  },
  {
    symbol: "supSolvBTC",
    label: "supSolvBTC → SolvBTC",
    home: "SolvBTC",
    unwrapHome: "SolvBTC",
    metadata:
      "0x224bee573e0ae84ba7f1eee4f7063a945ad7a268bea7ab9e004f6890177a480b",
    decimals: 18,
  },
];

export const VAULT_MODULE_ADDRESS =
  "0x4f6d2a2b4135099e683690a8a0ec9feac34320f383d17082cf9f75875219ce4b";
export const VAULT_MODULE_NAME = "vault";
export const VAULT_RESOURCE_ACCOUNT =
  "0xab00b03b339ad718c541bc78943b4d7ad435a1f5a3e8a0bf90b971eca36c0f22";
export const VAULT_ADMIN =
  "0x4f6d2a2b4135099e683690a8a0ec9feac34320f383d17082cf9f75875219ce4b";
export const VAULT_TESTNET_CHAIN_ID = "6";
export const SUPRA_MAINNET_CHAIN_ID = "8";
export const VAULT_DURATIONS = [
  { days: 7, label: "7 Days" },
  { days: 30, label: "30 Days" },
  { days: 90, label: "90 Days" },
] as const;
