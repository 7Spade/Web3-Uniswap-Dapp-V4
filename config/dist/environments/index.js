"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkConfig = exports.isTest = exports.isProduction = exports.isDevelopment = exports.env = void 0;
const dotenv_1 = require("dotenv");
// 加載環境變數
(0, dotenv_1.config)();
// 驗證必需的環境變數
function validateEnvironment() {
    const requiredVars = [
        'NEXT_PUBLIC_CHAIN_ID',
        'NEXT_PUBLIC_RPC_URL',
        'NEXT_PUBLIC_CONTRACT_ADDRESS'
    ];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    return {
        NEXT_PUBLIC_CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID),
        NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
        NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''
    };
}
// 導出驗證後的環境配置
exports.env = validateEnvironment();
// 環境特定配置
exports.isDevelopment = process.env.NODE_ENV === 'development';
exports.isProduction = process.env.NODE_ENV === 'production';
exports.isTest = process.env.NODE_ENV === 'test';
// 網絡配置
exports.networkConfig = {
    chainId: exports.env.NEXT_PUBLIC_CHAIN_ID,
    rpcUrl: exports.env.NEXT_PUBLIC_RPC_URL,
    contractAddress: exports.env.NEXT_PUBLIC_CONTRACT_ADDRESS
};
//# sourceMappingURL=index.js.map