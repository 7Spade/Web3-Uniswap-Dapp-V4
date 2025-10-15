# Web3 DApp Monorepo

這是一個包含 Next.js 前端和 Foundry 智能合約的 Web3 DApp 單體倉庫。

## 專案結構

```
├── frontend/          # Next.js 前端應用
├── contracts/         # Foundry 智能合約
├── memory-bank/       # 專案記憶庫
├── docs/             # 文檔
└── package.json      # 根目錄工作區配置
```

## 快速開始

### 1. 安裝依賴
```bash
yarn install
# 或使用 Makefile
make install
```

### 2. 環境配置
```bash
cp .env.example .env
# 編輯 .env 文件，填入您的 API 密鑰和私鑰
```

### 3. 開發模式
```bash
# 啟動前端開發服務器
yarn dev

# 啟動本地區塊鏈 (Anvil)
yarn anvil

# 同時啟動前端和區塊鏈
make dev:full
```

## 可用命令

### 開發命令
- `yarn dev` - 啟動前端開發服務器
- `yarn anvil` - 啟動本地 Anvil 區塊鏈
- `yarn genkit:dev` - 啟動 Genkit AI 開發服務器

### 構建命令
- `yarn build` - 構建前端
- `yarn forge:build` - 構建智能合約
- `yarn build:all` - 構建所有組件

### 測試命令
- `yarn test` - 運行所有測試
- `yarn test:frontend` - 運行前端測試
- `yarn test:contracts` - 運行合約測試
- `yarn coverage` - 運行合約測試並生成覆蓋率報告

### 部署命令
- `yarn deploy:local` - 部署到本地 Anvil
- `yarn deploy:testnet` - 部署到測試網
- `yarn deploy:mainnet` - 部署到主網

### 驗證命令
- `yarn verify:contracts` - 驗證已部署的合約
- `yarn gas-report` - 生成 gas 使用報告

## 使用 Makefile

您也可以使用 Makefile 中的便捷命令：

```bash
make help          # 顯示所有可用命令
make install       # 安裝依賴
make dev           # 啟動開發服務器
make test          # 運行測試
make build:all     # 構建所有組件
make deploy:local  # 部署到本地
```

## 環境變數

複製 `.env.example` 到 `.env` 並填入以下變數：

- `MAINNET_RPC_URL` - 主網 RPC URL
- `TESTNET_RPC_URL` - 測試網 RPC URL
- `PRIVATE_KEY` - 部署私鑰
- `ETHERSCAN_API_KEY` - Etherscan API 密鑰

## 技術棧

### 前端
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- RainbowKit (錢包連接)
- Wagmi (Web3 集成)

### 智能合約
- Foundry
- Solidity
- Forge (測試框架)

### 開發工具
- Yarn Workspaces
- ESLint
- Prettier
- Concurrently

## 貢獻

1. Fork 專案
2. 創建功能分支
3. 提交更改
4. 推送到分支
5. 創建 Pull Request
