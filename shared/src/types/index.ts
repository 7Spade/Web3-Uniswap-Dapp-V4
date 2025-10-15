import { Address } from 'viem'

// 網絡配置類型
export interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  blockExplorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

// 代幣類型
export interface Token {
  address: Address
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

// 交易類型
export interface Transaction {
  hash: string
  from: Address
  to: Address
  value: string
  gasUsed: string
  gasPrice: string
  blockNumber: number
  timestamp: number
  status: 'pending' | 'success' | 'failed'
}

// 合約 ABI 類型
export interface ContractABI {
  name: string
  address: Address
  abi: any[]
  network: string
}

// 用戶錢包類型
export interface WalletInfo {
  address: Address
  balance: string
  chainId: number
  isConnected: boolean
}

// API 響應類型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 模擬交易結果類型
export interface SimulationResult {
  success: boolean
  gasUsed: string
  gasPrice: string
  totalCost: string
  error?: string
  logs?: any[]
}

// 環境變數類型
export interface EnvironmentConfig {
  NEXT_PUBLIC_CHAIN_ID: number
  NEXT_PUBLIC_RPC_URL: string
  NEXT_PUBLIC_CONTRACT_ADDRESS: Address
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: string
}

// 組件 Props 類型
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// 表單類型
export interface SwapFormData {
  fromToken: Token
  toToken: Token
  amount: string
  slippage: number
}

// 錯誤類型
export interface AppError {
  code: string
  message: string
  details?: any
}