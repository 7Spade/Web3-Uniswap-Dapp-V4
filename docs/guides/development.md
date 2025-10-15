# 開發指南

## 快速開始

### 1. 環境設置

```bash
# 克隆專案
git clone <repository-url>
cd web3-dapp

# 安裝依賴
npm install

# 設置環境變數
cp .env.example .env
# 編輯 .env 文件
```

### 2. 開發模式

```bash
# 啟動所有服務
make dev:full

# 或分別啟動
npm run anvil      # 本地區塊鏈
npm run dev        # 前端開發服務器
```

### 3. 構建和測試

```bash
# 構建所有包
npm run build:all

# 運行測試
npm run test

# 類型檢查
npm run typecheck
```

## 開發工作流

### 1. 創建新功能

1. 在 `shared/src/types/` 中定義類型
2. 在 `shared/src/utils/` 中創建工具函數
3. 在 `frontend/src/components/` 中創建組件
4. 在 `contracts/src/` 中創建合約（如需要）

### 2. 添加新包

1. 創建包目錄
2. 添加 `package.json`
3. 更新根目錄 `workspaces`
4. 添加構建腳本

### 3. 代碼規範

- 使用 TypeScript
- 遵循 ESLint 規則
- 使用 Prettier 格式化
- 編寫單元測試
- 添加 JSDoc 註釋

## 調試技巧

### 前端調試

```bash
# 啟用詳細日誌
DEBUG=* npm run dev

# 檢查構建輸出
yarn build && npm run start
```

### 合約調試

```bash
# 詳細測試輸出
npm run forge:test -w contracts -vvv

# 調試特定測試
npm run forge:test -w contracts -- --match-test testFunctionName
```

## 常見問題

### 1. 依賴問題

```bash
# 清理並重新安裝
npm run clean:all
npm install
```

### 2. 類型錯誤

```bash
# 重新構建共享包
npm run build -w shared
```

### 3. 合約部署失敗

```bash
# 檢查網絡連接
npm run anvil -- --fork-url $MAINNET_RPC_URL
```