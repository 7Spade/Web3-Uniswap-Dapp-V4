import { Address, formatUnits, parseUnits } from 'viem'
import { Token, SimulationResult, AppError } from '../types'
import { ERROR_CODES } from '../constants'

// 格式化地址顯示
export function formatAddress(address: Address, length = 6): string {
  if (!address) return ''
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}

// 格式化代幣數量
export function formatTokenAmount(amount: string, decimals: number, displayDecimals = 4): string {
  try {
    const formatted = formatUnits(BigInt(amount), decimals)
    const num = parseFloat(formatted)
    return num.toFixed(displayDecimals)
  } catch {
    return '0'
  }
}

// 解析代幣數量
export function parseTokenAmount(amount: string, decimals: number): string {
  try {
    return parseUnits(amount, decimals).toString()
  } catch {
    return '0'
  }
}

// 計算交易成本
export function calculateTransactionCost(gasUsed: string, gasPrice: string): string {
  try {
    const gasUsedBigInt = BigInt(gasUsed)
    const gasPriceBigInt = BigInt(gasPrice)
    const cost = gasUsedBigInt * gasPriceBigInt
    return cost.toString()
  } catch {
    return '0'
  }
}

// 驗證地址格式
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// 驗證代幣數量
export function isValidTokenAmount(amount: string, decimals: number): boolean {
  try {
    const num = parseFloat(amount)
    if (isNaN(num) || num < 0) return false
    
    const maxDecimals = Math.pow(10, decimals)
    return num < maxDecimals
  } catch {
    return false
  }
}

// 創建錯誤對象
export function createError(code: string, message: string, details?: any): AppError {
  return { code, message, details }
}

// 處理 API 錯誤
export function handleApiError(error: any): AppError {
  if (error.code) {
    return error
  }
  
  if (error.message?.includes('insufficient funds')) {
    return createError(ERROR_CODES.INSUFFICIENT_BALANCE, 'Insufficient balance for transaction')
  }
  
  if (error.message?.includes('user rejected')) {
    return createError(ERROR_CODES.TRANSACTION_FAILED, 'Transaction rejected by user')
  }
  
  return createError(ERROR_CODES.NETWORK_ERROR, error.message || 'Unknown error occurred')
}

// 延遲函數
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 重試函數
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries) {
        await delay(delayMs * Math.pow(2, i)) // 指數退避
      }
    }
  }
  
  throw lastError
}

// 深拷貝
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// 防抖函數
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 節流函數
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 生成隨機 ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// 檢查是否為移動設備
export function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}