# 架構概覽

## 專案結構

```
web3-dapp/
├── frontend/          # Next.js 前端應用
├── contracts/         # Foundry 智能合約
├── shared/           # 共享類型和工具
├── config/           # 配置管理
├── memory-bank/      # 專案記憶庫
├── docs/            # 文檔
└── .github/         # CI/CD 配置
```

## 技術棧

### 前端
- **框架**: Next.js 15
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **狀態管理**: React Query + Context
- **Web3**: Wagmi + Viem
- **UI 組件**: Radix UI

### 智能合約
- **框架**: Foundry
- **語言**: Solidity
- **測試**: Forge
- **部署**: Forge Scripts

### 共享代碼
- **類型定義**: 統一的 TypeScript 類型
- **工具函數**: 可重用的工具函數
- **常數**: 網絡和合約配置

## 架構原則

1. **模組化**: 每個包都有明確的職責
2. **類型安全**: 全面的 TypeScript 支持
3. **可重用性**: 共享代碼最大化重用
4. **可維護性**: 清晰的代碼組織和文檔
5. **可擴展性**: 易於添加新功能和包

## 數據流

```
用戶操作 → 前端組件 → Web3 Hooks → 智能合約 → 區塊鏈
                ↓
            共享類型 ← 配置管理 ← 環境變數
```

## 開發工作流

1. **本地開發**: 使用 Anvil 本地區塊鏈
2. **測試**: 自動化測試覆蓋
3. **構建**: 多包並行構建
4. **部署**: CI/CD 自動化部署