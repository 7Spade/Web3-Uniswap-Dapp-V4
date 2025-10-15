import { config } from 'dotenv'
import { EnvironmentConfig } from '@web3-dapp/shared'

// 加載環境變數
config()

// 驗證必需的環境變數
function validateEnvironment(): EnvironmentConfig {
  const requiredVars = [
    'NEXT_PUBLIC_CHAIN_ID',
    'NEXT_PUBLIC_RPC_URL',
    'NEXT_PUBLIC_CONTRACT_ADDRESS'
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  return {
    NEXT_PUBLIC_CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID!),
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL!,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''
  }
}

// 導出驗證後的環境配置
export const env = validateEnvironment()

// 環境特定配置
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isTest = process.env.NODE_ENV === 'test'

// 網絡配置
export const networkConfig = {
  chainId: env.NEXT_PUBLIC_CHAIN_ID,
  rpcUrl: env.NEXT_PUBLIC_RPC_URL,
  contractAddress: env.NEXT_PUBLIC_CONTRACT_ADDRESS
}