import { NETWORKS, DEFAULT_NETWORK } from '@web3-dapp/shared'
import { env } from '@web3-dapp/config'

// 應用配置
export const appConfig = {
  name: 'Web3 DApp',
  version: '1.0.0',
  description: 'Web3 DApp with Next.js and Foundry',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// 網絡配置
export const networkConfig = {
  defaultNetwork: DEFAULT_NETWORK,
  supportedNetworks: Object.keys(NETWORKS),
  currentNetwork: env.NEXT_PUBLIC_CHAIN_ID
}

// API 配置
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  retries: 3
}

// UI 配置
export const uiConfig = {
  theme: {
    default: 'light',
    supported: ['light', 'dark', 'system']
  },
  layout: {
    headerHeight: 64,
    sidebarWidth: 256
  }
}

// 錢包配置
export const walletConfig = {
  projectId: env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [NETWORKS[DEFAULT_NETWORK]],
  appName: appConfig.name,
  appDescription: appConfig.description,
  appUrl: appConfig.url
}