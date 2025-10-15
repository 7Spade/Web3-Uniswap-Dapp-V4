import { Address } from 'viem';
import { AppError } from '../types';
export declare function formatAddress(address: Address, length?: number): string;
export declare function formatTokenAmount(amount: string, decimals: number, displayDecimals?: number): string;
export declare function parseTokenAmount(amount: string, decimals: number): string;
export declare function calculateTransactionCost(gasUsed: string, gasPrice: string): string;
export declare function isValidAddress(address: string): boolean;
export declare function isValidTokenAmount(amount: string, decimals: number): boolean;
export declare function createError(code: string, message: string, details?: any): AppError;
export declare function handleApiError(error: any): AppError;
export declare function delay(ms: number): Promise<void>;
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
export declare function deepClone<T>(obj: T): T;
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
export declare function generateId(): string;
export declare function isMobile(): boolean;
export declare function formatFileSize(bytes: number): string;
//# sourceMappingURL=index.d.ts.map