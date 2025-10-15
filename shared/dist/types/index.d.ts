import { Address } from 'viem';
export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    blockExplorerUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
}
export interface Token {
    address: Address;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}
export interface Transaction {
    hash: string;
    from: Address;
    to: Address;
    value: string;
    gasUsed: string;
    gasPrice: string;
    blockNumber: number;
    timestamp: number;
    status: 'pending' | 'success' | 'failed';
}
export interface ContractABI {
    name: string;
    address: Address;
    abi: any[];
    network: string;
}
export interface WalletInfo {
    address: Address;
    balance: string;
    chainId: number;
    isConnected: boolean;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface SimulationResult {
    success: boolean;
    gasUsed: string;
    gasPrice: string;
    totalCost: string;
    error?: string;
    logs?: any[];
}
export interface EnvironmentConfig {
    NEXT_PUBLIC_CHAIN_ID: number;
    NEXT_PUBLIC_RPC_URL: string;
    NEXT_PUBLIC_CONTRACT_ADDRESS: Address;
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: string;
}
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}
export interface SwapFormData {
    fromToken: Token;
    toToken: Token;
    amount: string;
    slippage: number;
}
export interface AppError {
    code: string;
    message: string;
    details?: any;
}
//# sourceMappingURL=index.d.ts.map