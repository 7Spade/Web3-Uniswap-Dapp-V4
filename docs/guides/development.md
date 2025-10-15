# 開發指南

## 快速開始

### 1. 環境設置

```bash
# 克隆專案
git clone <repository-url>
cd web3-dapp

# 安裝依賴
yarn install

# 設置環境變數
cp .env.example .env
# 編輯 .env 文件
```

### 2. 開發模式

```bash
# 啟動所有服務
make dev:full

# 或分別啟動
yarn anvil      # 本地區塊鏈
yarn dev        # 前端開發服務器
```

### 3. 構建和測試

```bash
# 構建所有包
yarn build:all

# 運行測試
yarn test

# 類型檢查
yarn typecheck
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
DEBUG=* yarn dev

# 檢查構建輸出
yarn build && yarn start
```

### 合約調試

```bash
# 詳細測試輸出
yarn forge:test -vvv

# 調試特定測試
yarn forge:test --match-test testFunctionName
```

## 常見問題

### 1. 依賴問題

```bash
# 清理並重新安裝
yarn clean:all
yarn install
```

### 2. 類型錯誤

```bash
# 重新構建共享包
yarn workspace shared build
```

### 3. 合約部署失敗

```bash
# 檢查網絡連接
yarn anvil --fork-url $MAINNET_RPC_URL
```