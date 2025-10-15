# 專案簡介 (Project Brief)

## 專案概述
**專案名稱**: nextn - Next.js 應用程式  
**版本**: 0.1.0  
**開發環境**: Windows 11  
**包管理器**: npm (或其他，如 pnpm)  

## 專案描述
這是一個基於 Next.js 15.3.3 的現代化 Web 應用程式，整合了多種先進技術和功能模組。

## 技術堆疊

### 核心框架
- **Next.js**: 15.3.3 (React 框架)
- **React**: 18.3.1
- **TypeScript**: 5.x

### UI 組件庫
- **Radix UI**: 完整的無障礙組件庫
- **Tailwind CSS**: 3.4.1 (樣式框架)
- **Lucide React**: 0.475.0 (圖標庫)

### Web3 整合
- **Wagmi**: 2.18.1 (React Hooks for Ethereum)
- **Viem**: 2.23.14 (TypeScript 以太坊庫)
- **RainbowKit**: 2.2.9 (錢包連接 UI)
- **@tanstack/react-query**: 5.90.3 (數據獲取)
- **next-themes**: 0.4.6 (主題切換)
- **react-icons**: 5.5.0 (圖標庫)
- **react-jazzicon**: 1.0.4 (頭像生成)

### AI 整合
- **Genkit**: 1.21.0 (Google AI 框架)
- **@genkit-ai/google-genai**: 1.21.0
- **@genkit-ai/next**: 1.21.0

### 表單處理
- **React Hook Form**: 7.65.0
- **Zod**: 3.24.2 (驗證)

### 其他依賴
- **Firebase**: 11.10.0
- **Recharts**: 2.15.4 (圖表)
- **Date-fns**: 3.6.0 (日期處理)
- **@vercel/analytics**: 1.5.0 (分析)

## 專案結構

### 主要目錄
- `src/app/` - Next.js App Router 頁面
- `src/components/` - React 組件
  - `web3/` - Web3 相關組件
  - `providers/` - 上下文提供者
  - `features/` - 功能組件
  - `ui/` - 基礎 UI 組件
- `src/ai/` - AI 相關功能
- `src/hooks/` - 自定義 React Hooks
- `src/lib/` - 工具函數和配置
  - `wagmi.ts` - Web3 配置
  - `web3-utils.ts` - Web3 工具函數
- `custom_modes/` - 自定義模式配置
- `docs/` - 專案文檔

### 關鍵檔案
- `next.config.ts` - Next.js 配置
- `tailwind.config.ts` - Tailwind CSS 配置
- `tsconfig.json` - TypeScript 配置
- `components.json` - 組件配置

## 開發腳本
- `npm run dev` - 開發伺服器 (port 9002)
- `npm run genkit:dev` - Genkit AI 開發
- `npm run build` - 生產建置
- `npm run lint` - 代碼檢查
- `npm run typecheck` - TypeScript 類型檢查

## 當前狀態
- ✅ 專案已初始化
- ✅ 基礎依賴已安裝
- ✅ 組件庫已配置
- ✅ AI 功能已整合
- ✅ Web3 功能已整合
- ✅ VAN 系統已初始化
- ✅ Web3-Uniswap-Dapp-V4-kk 價值搾取完成
- ✅ Memory Bank 與專案同步完成

## Web3 功能特色
- 🔗 多錢包連接支援 (MetaMask, Rainbow, WalletConnect 等)
- 🌐 多鏈支援 (Ethereum, Polygon, Arbitrum, Optimism, Base, Linea, BSC, Avalanche)
- 💰 錢包餘額顯示
- 🔗 ENS 名稱解析
- 📱 響應式設計
- 🎨 現代化 UI 組件
- ✍️ 訊息簽名功能
- 💸 原生代幣轉帳功能
- 📊 區塊號顯示
- 🔍 地址輸入驗證 (支援 ENS)

## 下一步
- 開發更多 Web3 功能
- 整合 DeFi 協議
- 優化用戶體驗
- 添加更多區塊鏈支援