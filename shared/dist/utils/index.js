import { formatUnits, parseUnits } from 'viem';
import { ERROR_CODES } from '../constants';
// 格式化地址顯示
export function formatAddress(address, length = 6) {
    if (!address)
        return '';
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}
// 格式化代幣數量
export function formatTokenAmount(amount, decimals, displayDecimals = 4) {
    try {
        const formatted = formatUnits(BigInt(amount), decimals);
        const num = parseFloat(formatted);
        return num.toFixed(displayDecimals);
    }
    catch {
        return '0';
    }
}
// 解析代幣數量
export function parseTokenAmount(amount, decimals) {
    try {
        return parseUnits(amount, decimals).toString();
    }
    catch {
        return '0';
    }
}
// 計算交易成本
export function calculateTransactionCost(gasUsed, gasPrice) {
    try {
        const gasUsedBigInt = BigInt(gasUsed);
        const gasPriceBigInt = BigInt(gasPrice);
        const cost = gasUsedBigInt * gasPriceBigInt;
        return cost.toString();
    }
    catch {
        return '0';
    }
}
// 驗證地址格式
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
// 驗證代幣數量
export function isValidTokenAmount(amount, decimals) {
    try {
        const num = parseFloat(amount);
        if (isNaN(num) || num < 0)
            return false;
        const maxDecimals = Math.pow(10, decimals);
        return num < maxDecimals;
    }
    catch {
        return false;
    }
}
// 創建錯誤對象
export function createError(code, message, details) {
    return { code, message, details };
}
// 處理 API 錯誤
export function handleApiError(error) {
    if (error.code) {
        return error;
    }
    if (error.message?.includes('insufficient funds')) {
        return createError(ERROR_CODES.INSUFFICIENT_BALANCE, 'Insufficient balance for transaction');
    }
    if (error.message?.includes('user rejected')) {
        return createError(ERROR_CODES.TRANSACTION_FAILED, 'Transaction rejected by user');
    }
    return createError(ERROR_CODES.NETWORK_ERROR, error.message || 'Unknown error occurred');
}
// 延遲函數
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// 重試函數
export async function retry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries) {
                await delay(delayMs * Math.pow(2, i)); // 指數退避
            }
        }
    }
    throw lastError;
}
// 深拷貝
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
// 防抖函數
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
// 節流函數
export function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
// 生成隨機 ID
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
// 檢查是否為移動設備
export function isMobile() {
    return typeof window !== 'undefined' && window.innerWidth < 768;
}
// 格式化文件大小
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
