# API 規格文檔

## 概述

本文檔詳細描述了 DynamicFeePool DApp 的 API 規格，包括 REST API、GraphQL API 和 WebSocket API 的接口定義、請求/響應格式和錯誤處理。

## API 架構

### 1. API 層次結構

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│  Authentication & Authorization                             │
├─────────────────────────────────────────────────────────────┤
│  Rate Limiting & Caching                                    │
├─────────────────────────────────────────────────────────────┤
│  API Endpoints                                              │
│  ├── REST API        ├── GraphQL API    ├── WebSocket API  │
├─────────────────────────────────────────────────────────────┤
│  Data Sources                                               │
│  ├── Smart Contracts ├── The Graph      ├── External APIs   │
└─────────────────────────────────────────────────────────────┘
```

### 2. 基礎 URL

- **主網**: `https://api.dynamicfeepool.com`
- **測試網**: `https://api-test.dynamicfeepool.com`
- **開發環境**: `https://api-dev.dynamicfeepool.com`

## REST API

### 1. 認證

#### 1.1 獲取訪問令牌

```http
POST /auth/token
Content-Type: application/json

{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Sign this message to authenticate"
}
```

**響應:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

#### 1.2 刷新令牌

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. 池子管理 API

#### 2.1 獲取池子列表

```http
GET /api/v1/pools?page=1&limit=20&sortBy=liquidity&sortOrder=desc&filters[tokenSymbol]=ETH&filters[minLiquidity]=1000000
Authorization: Bearer {accessToken}
```

**查詢參數:**
- `page`: 頁碼 (默認: 1)
- `limit`: 每頁數量 (默認: 20, 最大: 100)
- `sortBy`: 排序字段 (liquidity, volume, feeRate, createdAt)
- `sortOrder`: 排序方向 (asc, desc)
- `filters`: 過濾條件

**響應:**
```json
{
  "success": true,
  "data": {
    "pools": [
      {
        "address": "0x...",
        "tokenA": {
          "address": "0x...",
          "symbol": "ETH",
          "decimals": 18
        },
        "tokenB": {
          "address": "0x...",
          "symbol": "USDC",
          "decimals": 6
        },
        "currentFeeRate": 3000,
        "minFeeRate": 100,
        "maxFeeRate": 10000,
        "isDynamicFeeEnabled": true,
        "liquidity": "1000000000000000000000",
        "volume24h": "500000000000000000000",
        "transactions24h": 1500,
        "priceChange24h": 2.5,
        "createdAt": 1640995200,
        "creator": "0x..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  },
  "timestamp": 1640995200
}
```

#### 2.2 獲取池子詳情

```http
GET /api/v1/pools/{poolAddress}
Authorization: Bearer {accessToken}
```

**響應:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "tokenA": {
      "address": "0x...",
      "symbol": "ETH",
      "decimals": 18,
      "name": "Ethereum"
    },
    "tokenB": {
      "address": "0x...",
      "symbol": "USDC",
      "decimals": 6,
      "name": "USD Coin"
    },
    "feeParameters": {
      "currentFeeRate": 3000,
      "minFeeRate": 100,
      "maxFeeRate": 10000,
      "adjustmentStep": 100,
      "cooldownPeriod": 3600,
      "lastAdjustment": 1640991600
    },
    "metrics": {
      "liquidity": "1000000000000000000000",
      "volume24h": "500000000000000000000",
      "volume7d": "3000000000000000000000",
      "volume30d": "12000000000000000000000",
      "transactions24h": 1500,
      "transactions7d": 10000,
      "transactions30d": 40000,
      "priceChange24h": 2.5,
      "priceChange7d": 5.2,
      "priceChange30d": 12.8,
      "impermanentLoss": 0.5,
      "totalLPRewards": "10000000000000000000",
      "feeRevenue": "5000000000000000000"
    },
    "feeHistory": [
      {
        "timestamp": 1640991600,
        "feeRate": 3000,
        "reason": "VOLUME_INCREASE",
        "volume": "500000000000000000000",
        "volatility": 2.5
      }
    ],
    "liquidityHistory": [
      {
        "timestamp": 1640991600,
        "liquidity": "1000000000000000000000",
        "price": "2000000000000000000000"
      }
    ],
    "createdAt": 1640995200,
    "creator": "0x...",
    "isActive": true
  },
  "timestamp": 1640995200
}
```

#### 2.3 創建池子

```http
POST /api/v1/pools
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tokenA": "0x...",
  "tokenB": "0x...",
  "initialFeeRate": 3000,
  "minFeeRate": 100,
  "maxFeeRate": 10000,
  "feeAdjustmentStep": 100,
  "feeAdjustmentCooldown": 3600,
  "feeAdjustmentParams": {
    "volumeThreshold": "1000000000000000000000",
    "volatilityThreshold": 500,
    "liquidityThreshold": "10000000000000000000000",
    "adjustmentFactor": 1000,
    "maxAdjustmentPercent": 2000
  },
  "enableDynamicFee": true,
  "name": "ETH/USDC Dynamic Pool",
  "description": "Dynamic fee pool for ETH/USDC trading"
}
```

**響應:**
```json
{
  "success": true,
  "data": {
    "poolAddress": "0x...",
    "transactionHash": "0x...",
    "gasUsed": 500000,
    "gasPrice": "20000000000",
    "status": "pending"
  },
  "timestamp": 1640995200
}
```

### 3. 治理 API

#### 3.1 獲取提案列表

```http
GET /api/v1/governance/proposals?page=1&limit=20&status=active&type=fee_adjustment
Authorization: Bearer {accessToken}
```

**響應:**
```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "proposalId": "1",
        "title": "Increase ETH/USDC Pool Fee Rate",
        "description": "Proposal to increase the fee rate for ETH/USDC pool from 0.3% to 0.5%",
        "type": "FEE_ADJUSTMENT",
        "status": "ACTIVE",
        "proposer": "0x...",
        "createdAt": 1640995200,
        "votingStartTime": 1640995200,
        "votingEndTime": 1641254400,
        "executionTime": null,
        "forVotes": "1000000000000000000000",
        "againstVotes": "200000000000000000000",
        "abstainVotes": "100000000000000000000",
        "totalVotes": "1300000000000000000000",
        "totalVotingPower": "10000000000000000000000",
        "participationRate": 13.0,
        "isExecuted": false,
        "relatedPools": ["0x..."],
        "executionData": "0x..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "timestamp": 1640995200
}
```

#### 3.2 創建提案

```http
POST /api/v1/governance/proposals
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Increase ETH/USDC Pool Fee Rate",
  "description": "This proposal aims to increase the fee rate for the ETH/USDC pool from 0.3% to 0.5% to better align with market conditions and improve LP rewards.",
  "type": "FEE_ADJUSTMENT",
  "executionData": {
    "poolAddress": "0x...",
    "newFeeRate": 5000,
    "minFeeRate": 100,
    "maxFeeRate": 10000,
    "adjustmentStep": 100,
    "cooldownPeriod": 3600
  },
  "relatedPools": ["0x..."]
}
```

#### 3.3 投票

```http
POST /api/v1/governance/proposals/{proposalId}/vote
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "support": true,
  "votes": "1000000000000000000000",
  "reason": "I support this proposal because it will improve LP rewards and better reflect market conditions."
}
```

### 4. 流動性管理 API

#### 4.1 獲取流動性位置

```http
GET /api/v1/liquidity/positions?user={userAddress}&pool={poolAddress}
Authorization: Bearer {accessToken}
```

**響應:**
```json
{
  "success": true,
  "data": {
    "positions": [
      {
        "positionId": "1",
        "user": "0x...",
        "pool": "0x...",
        "amountA": "1000000000000000000",
        "amountB": "2000000000000",
        "liquidityShares": "1000000000000000000000",
        "totalLiquidityShares": "10000000000000000000000",
        "sharePercentage": 10.0,
        "createdAt": 1640995200,
        "lastUpdated": 1640995200,
        "accumulatedFees": "500000000000000000",
        "unclaimedRewards": "100000000000000000"
      }
    ]
  },
  "timestamp": 1640995200
}
```

#### 4.2 添加流動性

```http
POST /api/v1/liquidity/add
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "poolAddress": "0x...",
  "amountA": "1000000000000000000",
  "amountB": "2000000000000",
  "slippageTolerance": 0.5,
  "deadline": 1640998800
}
```

#### 4.3 移除流動性

```http
POST /api/v1/liquidity/remove
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "positionId": "1",
  "amount": "500000000000000000",
  "slippageTolerance": 0.5,
  "deadline": 1640998800
}
```

### 5. 分析 API

#### 5.1 獲取全局統計

```http
GET /api/v1/analytics/global
Authorization: Bearer {accessToken}
```

**響應:**
```json
{
  "success": true,
  "data": {
    "totalPools": 150,
    "activePools": 120,
    "totalLiquidity": "1000000000000000000000000",
    "totalVolume24h": "500000000000000000000000",
    "totalFees24h": "15000000000000000000000",
    "averageFeeRate": 3000,
    "mostActivePool": "0x...",
    "highestYieldPool": "0x...",
    "liquidityChange24h": 5.2,
    "volumeChange24h": 12.8,
    "feeRateChange24h": -2.1
  },
  "timestamp": 1640995200
}
```

#### 5.2 獲取池子分析

```http
GET /api/v1/analytics/pools/{poolAddress}?period=7d&metrics=liquidity,volume,feeRate
Authorization: Bearer {accessToken}
```

**響應:**
```json
{
  "success": true,
  "data": {
    "poolAddress": "0x...",
    "period": "7d",
    "metrics": {
      "liquidity": {
        "current": "1000000000000000000000",
        "change24h": 5.2,
        "change7d": 12.8,
        "history": [
          {
            "timestamp": 1640995200,
            "value": "1000000000000000000000"
          }
        ]
      },
      "volume": {
        "current": "500000000000000000000",
        "change24h": 12.8,
        "change7d": 25.6,
        "history": [
          {
            "timestamp": 1640995200,
            "value": "500000000000000000000"
          }
        ]
      },
      "feeRate": {
        "current": 3000,
        "change24h": -2.1,
        "change7d": 5.5,
        "history": [
          {
            "timestamp": 1640995200,
            "value": 3000
          }
        ]
      }
    },
    "riskScore": 7.5,
    "recommendations": [
      "Consider increasing fee rate due to high volatility",
      "Monitor liquidity depth for large trades"
    ]
  },
  "timestamp": 1640995200
}
```

## GraphQL API

### 1. Schema 定義

```graphql
type Query {
  pools(
    first: Int
    skip: Int
    orderBy: Pool_orderBy
    orderDirection: OrderDirection
    where: Pool_filter
  ): [Pool!]!
  
  pool(id: ID!): Pool
  
  proposals(
    first: Int
    skip: Int
    orderBy: Proposal_orderBy
    orderDirection: OrderDirection
    where: Proposal_filter
  ): [Proposal!]!
  
  proposal(id: ID!): Proposal
  
  user(id: ID!): User
  
  analytics: Analytics!
}

type Pool {
  id: ID!
  address: Bytes!
  tokenA: Token!
  tokenB: Token!
  currentFeeRate: BigInt!
  minFeeRate: BigInt!
  maxFeeRate: BigInt!
  isDynamicFeeEnabled: Boolean!
  liquidity: BigInt!
  volume24h: BigInt!
  transactions24h: BigInt!
  priceChange24h: BigDecimal!
  createdAt: BigInt!
  creator: Bytes!
  metrics: PoolMetrics!
  feeHistory: [FeeAdjustment!]!
}

type Token {
  id: ID!
  address: Bytes!
  symbol: String!
  name: String!
  decimals: Int!
}

type PoolMetrics {
  id: ID!
  pool: Pool!
  liquidity: BigInt!
  volume24h: BigInt!
  volume7d: BigInt!
  volume30d: BigInt!
  transactions24h: BigInt!
  transactions7d: BigInt!
  transactions30d: BigInt!
  priceChange24h: BigDecimal!
  priceChange7d: BigDecimal!
  priceChange30d: BigDecimal!
  impermanentLoss: BigDecimal!
  totalLPRewards: BigInt!
  feeRevenue: BigInt!
  lastUpdated: BigInt!
}

type FeeAdjustment {
  id: ID!
  pool: Pool!
  previousFee: BigInt!
  newFee: BigInt!
  reason: String!
  timestamp: BigInt!
  adjuster: Bytes!
  isAutomatic: Boolean!
}

type Proposal {
  id: ID!
  title: String!
  description: String!
  type: String!
  status: String!
  proposer: Bytes!
  createdAt: BigInt!
  votingStartTime: BigInt!
  votingEndTime: BigInt!
  executionTime: BigInt
  forVotes: BigInt!
  againstVotes: BigInt!
  abstainVotes: BigInt!
  totalVotes: BigInt!
  totalVotingPower: BigInt!
  participationRate: BigDecimal!
  isExecuted: Boolean!
  relatedPools: [Pool!]!
  votes: [Vote!]!
}

type Vote {
  id: ID!
  proposal: Proposal!
  voter: Bytes!
  support: Boolean!
  votes: BigInt!
  reason: String
  timestamp: BigInt!
}

type User {
  id: ID!
  address: Bytes!
  votingPower: BigInt!
  stakedBalance: BigInt!
  delegatedBalance: BigInt!
  positions: [LiquidityPosition!]!
  votes: [Vote!]!
}

type LiquidityPosition {
  id: ID!
  user: User!
  pool: Pool!
  amountA: BigInt!
  amountB: BigInt!
  liquidityShares: BigInt!
  sharePercentage: BigDecimal!
  createdAt: BigInt!
  lastUpdated: BigInt!
  accumulatedFees: BigInt!
  unclaimedRewards: BigInt!
}

type Analytics {
  totalPools: Int!
  activePools: Int!
  totalLiquidity: BigInt!
  totalVolume24h: BigInt!
  totalFees24h: BigInt!
  averageFeeRate: BigInt!
  mostActivePool: Pool
  highestYieldPool: Pool
}

enum Pool_orderBy {
  id
  address
  currentFeeRate
  liquidity
  volume24h
  transactions24h
  createdAt
}

enum Proposal_orderBy {
  id
  createdAt
  votingStartTime
  votingEndTime
  totalVotes
  participationRate
}

enum OrderDirection {
  asc
  desc
}

input Pool_filter {
  id: ID
  address: Bytes
  tokenA: String
  tokenB: String
  currentFeeRate: BigInt
  isDynamicFeeEnabled: Boolean
  liquidity_gte: BigInt
  liquidity_lte: BigInt
  volume24h_gte: BigInt
  volume24h_lte: BigInt
}

input Proposal_filter {
  id: ID
  type: String
  status: String
  proposer: Bytes
  createdAt_gte: BigInt
  createdAt_lte: BigInt
  votingStartTime_gte: BigInt
  votingStartTime_lte: BigInt
  votingEndTime_gte: BigInt
  votingEndTime_lte: BigInt
}
```

### 2. 查詢示例

#### 2.1 獲取池子列表

```graphql
query GetPools($first: Int, $skip: Int, $orderBy: Pool_orderBy, $orderDirection: OrderDirection) {
  pools(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
  ) {
    id
    address
    tokenA {
      symbol
      name
      decimals
    }
    tokenB {
      symbol
      name
      decimals
    }
    currentFeeRate
    liquidity
    volume24h
    transactions24h
    priceChange24h
    isDynamicFeeEnabled
  }
}
```

#### 2.2 獲取池子詳情

```graphql
query GetPool($id: ID!) {
  pool(id: $id) {
    id
    address
    tokenA {
      address
      symbol
      name
      decimals
    }
    tokenB {
      address
      symbol
      name
      decimals
    }
    currentFeeRate
    minFeeRate
    maxFeeRate
    isDynamicFeeEnabled
    metrics {
      liquidity
      volume24h
      volume7d
      volume30d
      transactions24h
      priceChange24h
      priceChange7d
      priceChange30d
      impermanentLoss
      totalLPRewards
      feeRevenue
    }
    feeHistory {
      previousFee
      newFee
      reason
      timestamp
      adjuster
      isAutomatic
    }
  }
}
```

#### 2.3 獲取提案列表

```graphql
query GetProposals($first: Int, $skip: Int, $where: Proposal_filter) {
  proposals(
    first: $first
    skip: $skip
    where: $where
  ) {
    id
    title
    description
    type
    status
    proposer
    createdAt
    votingStartTime
    votingEndTime
    forVotes
    againstVotes
    totalVotes
    participationRate
    isExecuted
    relatedPools {
      id
      address
      tokenA {
        symbol
      }
      tokenB {
        symbol
      }
    }
  }
}
```

## WebSocket API

### 1. 連接

```javascript
const ws = new WebSocket('wss://api.dynamicfeepool.com/ws');

ws.onopen = function() {
  console.log('Connected to WebSocket');
  
  // 認證
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-access-token'
  }));
};
```

### 2. 訂閱池子更新

```javascript
// 訂閱特定池子的更新
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'pool_updates',
  poolAddress: '0x...'
}));

// 訂閱所有池子的更新
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'pool_updates'
}));
```

### 3. 訂閱治理更新

```javascript
// 訂閱提案更新
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'proposal_updates'
}));

// 訂閱投票更新
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'vote_updates',
  proposalId: '1'
}));
```

### 4. 消息格式

#### 4.1 池子更新消息

```json
{
  "type": "pool_update",
  "channel": "pool_updates",
  "data": {
    "poolAddress": "0x...",
    "currentFeeRate": 3000,
    "liquidity": "1000000000000000000000",
    "volume24h": "500000000000000000000",
    "transactions24h": 1500,
    "priceChange24h": 2.5,
    "timestamp": 1640995200
  }
}
```

#### 4.2 提案更新消息

```json
{
  "type": "proposal_update",
  "channel": "proposal_updates",
  "data": {
    "proposalId": "1",
    "status": "ACTIVE",
    "forVotes": "1000000000000000000000",
    "againstVotes": "200000000000000000000",
    "totalVotes": "1300000000000000000000",
    "participationRate": 13.0,
    "timestamp": 1640995200
  }
}
```

## 錯誤處理

### 1. 錯誤代碼

| 代碼 | 狀態碼 | 說明 |
|------|--------|------|
| 1000 | 400 | 無效請求 |
| 1001 | 400 | 缺少必需參數 |
| 1002 | 400 | 無效參數值 |
| 1003 | 401 | 未授權 |
| 1004 | 401 | 令牌過期 |
| 1005 | 403 | 權限不足 |
| 1006 | 404 | 資源不存在 |
| 1007 | 409 | 資源衝突 |
| 1008 | 429 | 請求過於頻繁 |
| 1009 | 500 | 內部服務器錯誤 |
| 1010 | 503 | 服務不可用 |

### 2. 錯誤響應格式

```json
{
  "success": false,
  "error": {
    "code": 1001,
    "message": "Missing required parameter: poolAddress",
    "details": {
      "parameter": "poolAddress",
      "type": "string",
      "required": true
    }
  },
  "timestamp": 1640995200
}
```

## 速率限制

### 1. 限制規則

| 端點類型 | 限制 | 時間窗口 |
|----------|------|----------|
| 認證 | 10 請求 | 1 分鐘 |
| 查詢 | 100 請求 | 1 分鐘 |
| 寫入 | 20 請求 | 1 分鐘 |
| WebSocket | 1 連接 | 永久 |

### 2. 限制響應

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995800

{
  "success": false,
  "error": {
    "code": 1008,
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": 1640995800
    }
  }
}
```

## 版本控制

### 1. API 版本

- **當前版本**: v1
- **版本策略**: 語義化版本控制
- **向後兼容**: 至少保持 6 個月

### 2. 版本標頭

```http
GET /api/v1/pools
Accept: application/vnd.dynamicfeepool.v1+json
API-Version: 1.0.0
```

## 監控和日誌

### 1. 監控指標

- 請求數量
- 響應時間
- 錯誤率
- 可用性
- 吞吐量

### 2. 日誌格式

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "service": "api-gateway",
  "requestId": "req_123456789",
  "method": "GET",
  "path": "/api/v1/pools",
  "statusCode": 200,
  "responseTime": 150,
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

這個 API 規格文檔提供了完整的接口定義，包括 REST API、GraphQL API 和 WebSocket API 的詳細規格。每個端點都有清晰的請求/響應格式、錯誤處理和速率限制說明，確保開發者能夠順利集成和使用這些 API。