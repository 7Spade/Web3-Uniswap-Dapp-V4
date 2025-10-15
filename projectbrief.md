# 專案簡介 (Project Brief)

## 專案概述
**專案名稱**: nextn - Next.js 應用程式  
**版本**: 0.1.0  
**開發環境**: Windows 11  
**包管理器**: yarn  

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

### AI 整合
- **Genkit**: 1.20.0 (Google AI 框架)
- **@genkit-ai/google-genai**: 1.20.0
- **@genkit-ai/next**: 1.20.0

### 表單處理
- **React Hook Form**: 7.54.2
- **Zod**: 3.24.2 (驗證)

### 其他依賴
- **Firebase**: 11.9.1
- **Recharts**: 2.15.1 (圖表)
- **Date-fns**: 3.6.0 (日期處理)

## 專案結構

### 主要目錄
- `src/app/` - Next.js App Router 頁面
- `src/components/` - React 組件
- `src/ai/` - AI 相關功能
- `src/hooks/` - 自定義 React Hooks
- `src/lib/` - 工具函數和配置
- `custom_modes/` - 自定義模式配置
- `docs/` - 專案文檔

### 關鍵檔案
- `next.config.ts` - Next.js 配置
- `tailwind.config.ts` - Tailwind CSS 配置
- `tsconfig.json` - TypeScript 配置
- `components.json` - 組件配置

## 開發腳本
- `yarn dev` - 開發伺服器 (port 9002)
- `yarn genkit:dev` - Genkit AI 開發
- `yarn build` - 生產建置
- `yarn lint` - 代碼檢查
- `yarn typecheck` - TypeScript 類型檢查

## 當前狀態
- 專案已初始化
- 基礎依賴已安裝
- 組件庫已配置
- AI 功能已整合
- 準備進行 VAN 系統初始化

## 下一步
- 完成 VAN 模式分割系統初始化
- 建立 Memory Bank 檔案結構
- 執行環境檢查和驗證