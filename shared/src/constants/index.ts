import { NetworkConfig } from '../types'

// 支持的網絡配置
export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_KEY',
    blockExplorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  linea: {
    chainId: 59144,
    name: 'Linea',
    rpcUrl: 'https://rpc.linea.build',
    blockExplorerUrl: 'https://lineascan.build',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  lineaTestnet: {
    chainId: 59140,
    name: 'Linea Testnet',
    rpcUrl: 'https://rpc.sepolia.linea.build',
    blockExplorerUrl: 'https://sepolia.lineascan.build',
    nativeCurrency: {
      name: 'Linea Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
}

// 默認網絡
export const DEFAULT_NETWORK = 'lineaTestnet'

// 常用代幣地址
export const TOKEN_ADDRESSES = {
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
} as const

// 合約地址
export const CONTRACT_ADDRESSES = {
  COUNTER: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
} as const

// API 端點
export const API_ENDPOINTS = {
  SIMULATE_TRANSACTION: '/api/simulate',
  GET_TOKEN_INFO: '/api/token',
  GET_BALANCE: '/api/balance'
} as const

// 錯誤代碼
export const ERROR_CODES = {
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_INPUT: 'INVALID_INPUT'
} as const

// 默認配置
export const DEFAULT_CONFIG = {
  SLIPPAGE_TOLERANCE: 0.5, // 0.5%
  GAS_LIMIT_MULTIPLIER: 1.2,
  MAX_RETRIES: 3,
  TIMEOUT: 30000 // 30 seconds
} as const

// 本地存儲鍵
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'wallet_address',
  SELECTED_NETWORK: 'selected_network',
  USER_PREFERENCES: 'user_preferences'
} as const