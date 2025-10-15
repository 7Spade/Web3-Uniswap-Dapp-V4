import { NetworkConfig } from '../types';
export declare const NETWORKS: Record<string, NetworkConfig>;
export declare const DEFAULT_NETWORK = "lineaTestnet";
export declare const TOKEN_ADDRESSES: {
    readonly WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    readonly USDC: "0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C";
    readonly USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7";
};
export declare const CONTRACT_ADDRESSES: {
    readonly COUNTER: string;
};
export declare const API_ENDPOINTS: {
    readonly SIMULATE_TRANSACTION: "/api/simulate";
    readonly GET_TOKEN_INFO: "/api/token";
    readonly GET_BALANCE: "/api/balance";
};
export declare const ERROR_CODES: {
    readonly WALLET_NOT_CONNECTED: "WALLET_NOT_CONNECTED";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly TRANSACTION_FAILED: "TRANSACTION_FAILED";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
};
export declare const DEFAULT_CONFIG: {
    readonly SLIPPAGE_TOLERANCE: 0.5;
    readonly GAS_LIMIT_MULTIPLIER: 1.2;
    readonly MAX_RETRIES: 3;
    readonly TIMEOUT: 30000;
};
export declare const STORAGE_KEYS: {
    readonly WALLET_ADDRESS: "wallet_address";
    readonly SELECTED_NETWORK: "selected_network";
    readonly USER_PREFERENCES: "user_preferences";
};
//# sourceMappingURL=index.d.ts.map