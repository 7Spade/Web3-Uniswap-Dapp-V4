# 部署計劃文檔

## 概述

本文檔詳細描述了 DynamicFeePool DApp 的部署策略，包括開發環境、測試網、主網的部署流程、環境配置、監控設置和回滾策略。

## 部署架構

### 1. 部署環境層次

```
┌─────────────────────────────────────────────────────────────┐
│                    Production (Mainnet)                     │
│  ├── Ethereum Mainnet    ├── Polygon    ├── Arbitrum       │
├─────────────────────────────────────────────────────────────┤
│                    Staging (Testnet)                        │
│  ├── Goerli Testnet     ├── Mumbai      ├── Arbitrum Goerli│
├─────────────────────────────────────────────────────────────┤
│                    Development (Local)                      │
│  ├── Anvil Local       ├── Hardhat     ├── Ganache        │
└─────────────────────────────────────────────────────────────┘
```

### 2. 部署組件

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│  ├── Next.js App       ├── CDN          ├── Edge Functions │
├─────────────────────────────────────────────────────────────┤
│                    Backend (AWS)                            │
│  ├── API Gateway       ├── Lambda       ├── RDS            │
│  ├── The Graph         ├── Redis        ├── S3              │
├─────────────────────────────────────────────────────────────┤
│                    Smart Contracts                          │
│  ├── DynamicFeeHook    ├── LiquidityIncentiveHook          │
│  ├── DynamicFeeDAO     ├── Treasury     ├── Token          │
└─────────────────────────────────────────────────────────────┘
```

## 智能合約部署

### 1. 部署腳本

```solidity
// scripts/DeployProtocol.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {DynamicFeeToken} from "../src/token/DynamicFeeToken.sol";
import {DynamicFeeHook} from "../src/hooks/DynamicFeeHook.sol";
import {LiquidityIncentiveHook} from "../src/hooks/LiquidityIncentiveHook.sol";
import {DynamicFeeDAO} from "../src/governance/DynamicFeeDAO.sol";
import {Treasury} from "../src/treasury/Treasury.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

contract DeployProtocol is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. 部署治理代幣
        DynamicFeeToken token = new DynamicFeeToken();
        console.log("DynamicFeeToken deployed at:", address(token));
        
        // 2. 部署時間鎖
        address[] memory proposers = new address[](1);
        proposers[0] = deployer;
        address[] memory executors = new address[](1);
        executors[0] = deployer;
        
        TimelockController timelock = new TimelockController(
            1 days, // 最小延遲
            proposers,
            executors,
            deployer // 取消者
        );
        console.log("TimelockController deployed at:", address(timelock));
        
        // 3. 部署 DAO
        DynamicFeeDAO dao = new DynamicFeeDAO(
            address(token),
            address(timelock),
            deployer
        );
        console.log("DynamicFeeDAO deployed at:", address(dao));
        
        // 4. 部署金庫
        Treasury treasury = new Treasury();
        console.log("Treasury deployed at:", address(treasury));
        
        // 5. 部署 Hook 合約
        DynamicFeeHook feeHook = new DynamicFeeHook(address(0)); // PoolManager 地址
        console.log("DynamicFeeHook deployed at:", address(feeHook));
        
        LiquidityIncentiveHook incentiveHook = new LiquidityIncentiveHook(
            address(0), // PoolManager 地址
            address(token)
        );
        console.log("LiquidityIncentiveHook deployed at:", address(incentiveHook));
        
        // 6. 設置權限
        token.transferOwnership(address(timelock));
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(dao));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(dao));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(dao));
        
        // 7. 初始化代幣分配
        _initializeTokenDistribution(token, deployer);
        
        vm.stopBroadcast();
        
        // 8. 驗證合約
        _verifyContracts();
        
        // 9. 生成部署報告
        _generateDeploymentReport();
    }
    
    function _initializeTokenDistribution(DynamicFeeToken token, address deployer) internal {
        // 社區空投 40%
        uint256 communityAllocation = token.totalSupply() * 40 / 100;
        token.mint(deployer, communityAllocation);
        
        // 流動性挖礦 30%
        uint256 miningAllocation = token.totalSupply() * 30 / 100;
        token.mint(deployer, miningAllocation);
        
        // 團隊 20%
        uint256 teamAllocation = token.totalSupply() * 20 / 100;
        token.mint(deployer, teamAllocation);
        
        // 儲備金 10%
        uint256 reserveAllocation = token.totalSupply() * 10 / 100;
        token.mint(deployer, reserveAllocation);
    }
    
    function _verifyContracts() internal {
        // 驗證合約源碼
        console.log("Verifying contracts...");
        // 實際驗證邏輯
    }
    
    function _generateDeploymentReport() internal view {
        console.log("=== DEPLOYMENT REPORT ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", msg.sender);
        console.log("Deployment Time:", block.timestamp);
        console.log("Gas Used:", gasleft());
    }
}
```

### 2. 環境配置

```bash
# .env.example
# 網絡配置
RPC_URL_MAINNET=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
RPC_URL_GOERLI=https://goerli.infura.io/v3/YOUR_PROJECT_ID
RPC_URL_POLYGON=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
RPC_URL_MUMBAI=https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID

# 私鑰配置
PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=0x...

# 驗證配置
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# 合約地址
POOL_MANAGER_ADDRESS=0x...
GOVERNANCE_TOKEN_ADDRESS=0x...
TREASURY_ADDRESS=0x...

# 前端配置
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
NEXT_PUBLIC_API_URL=https://api.dynamicfeepool.com
```

### 3. 部署腳本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函數定義
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查環境變數
check_env() {
    log_info "Checking environment variables..."
    
    if [ -z "$PRIVATE_KEY" ]; then
        log_error "PRIVATE_KEY is not set"
        exit 1
    fi
    
    if [ -z "$RPC_URL" ]; then
        log_error "RPC_URL is not set"
        exit 1
    fi
    
    log_info "Environment variables check passed"
}

# 編譯合約
compile_contracts() {
    log_info "Compiling contracts..."
    forge build
    if [ $? -eq 0 ]; then
        log_info "Contracts compiled successfully"
    else
        log_error "Contract compilation failed"
        exit 1
    fi
}

# 運行測試
run_tests() {
    log_info "Running tests..."
    forge test
    if [ $? -eq 0 ]; then
        log_info "All tests passed"
    else
        log_error "Tests failed"
        exit 1
    fi
}

# 部署合約
deploy_contracts() {
    log_info "Deploying contracts to $NETWORK..."
    forge script scripts/DeployProtocol.sol:DeployProtocol \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --broadcast \
        --verify \
        --etherscan-api-key $ETHERSCAN_API_KEY
    if [ $? -eq 0 ]; then
        log_info "Contracts deployed successfully"
    else
        log_error "Contract deployment failed"
        exit 1
    fi
}

# 驗證合約
verify_contracts() {
    log_info "Verifying contracts..."
    forge verify-contract \
        --chain-id $CHAIN_ID \
        --num-of-optimizations 200 \
        --watch \
        --etherscan-api-key $ETHERSCAN_API_KEY \
        $CONTRACT_ADDRESS \
        src/contracts/Contract.sol:Contract
}

# 生成部署報告
generate_report() {
    log_info "Generating deployment report..."
    
    cat > deployment-report.json << EOF
{
  "network": "$NETWORK",
  "chainId": $CHAIN_ID,
  "deployer": "$DEPLOYER_ADDRESS",
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "DynamicFeeToken": "$TOKEN_ADDRESS",
    "DynamicFeeDAO": "$DAO_ADDRESS",
    "Treasury": "$TREASURY_ADDRESS",
    "DynamicFeeHook": "$FEE_HOOK_ADDRESS",
    "LiquidityIncentiveHook": "$INCENTIVE_HOOK_ADDRESS"
  },
  "gasUsed": "$GAS_USED",
  "transactionHash": "$TX_HASH"
}
EOF
    
    log_info "Deployment report generated: deployment-report.json"
}

# 主函數
main() {
    log_info "Starting deployment process..."
    
    # 解析命令行參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            --network)
                NETWORK="$2"
                shift 2
                ;;
            --rpc-url)
                RPC_URL="$2"
                shift 2
                ;;
            --private-key)
                PRIVATE_KEY="$2"
                shift 2
                ;;
            --verify)
                VERIFY=true
                shift
                ;;
            --test)
                RUN_TESTS=true
                shift
                ;;
            *)
                log_error "Unknown option $1"
                exit 1
                ;;
        esac
    done
    
    # 設置默認值
    NETWORK=${NETWORK:-"mainnet"}
    VERIFY=${VERIFY:-false}
    RUN_TESTS=${RUN_TESTS:-true}
    
    # 根據網絡設置配置
    case $NETWORK in
        "mainnet")
            CHAIN_ID=1
            ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY
            ;;
        "goerli")
            CHAIN_ID=5
            ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY
            ;;
        "polygon")
            CHAIN_ID=137
            ETHERSCAN_API_KEY=$POLYGONSCAN_API_KEY
            ;;
        "mumbai")
            CHAIN_ID=80001
            ETHERSCAN_API_KEY=$POLYGONSCAN_API_KEY
            ;;
        *)
            log_error "Unsupported network: $NETWORK"
            exit 1
            ;;
    esac
    
    # 執行部署流程
    check_env
    compile_contracts
    
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    deploy_contracts
    
    if [ "$VERIFY" = true ]; then
        verify_contracts
    fi
    
    generate_report
    
    log_info "Deployment completed successfully!"
}

# 執行主函數
main "$@"
```

## 前端部署

### 1. Vercel 配置

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_CHAIN_ID": "@chain_id",
    "NEXT_PUBLIC_RPC_URL": "@rpc_url",
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID": "@walletconnect_project_id"
  },
  "functions": {
    "src/pages/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. 環境變數配置

```bash
# .env.production
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
NEXT_PUBLIC_API_URL=https://api.dynamicfeepool.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### 3. 部署腳本

```bash
#!/bin/bash
# scripts/deploy-frontend.sh

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查環境
check_environment() {
    log_info "Checking environment..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed"
        exit 1
    fi
    
    log_info "Environment check passed"
}

# 安裝依賴
install_dependencies() {
    log_info "Installing dependencies..."
    npm ci
    if [ $? -eq 0 ]; then
        log_info "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
}

# 運行測試
run_tests() {
    log_info "Running tests..."
    npm run test
    if [ $? -eq 0 ]; then
        log_info "All tests passed"
    else
        log_error "Tests failed"
        exit 1
    fi
}

# 建置應用
build_application() {
    log_info "Building application..."
    npm run build
    if [ $? -eq 0 ]; then
        log_info "Application built successfully"
    else
        log_error "Build failed"
        exit 1
    fi
}

# 部署到 Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel..."
    
    # 設置環境變數
    vercel env add NEXT_PUBLIC_CHAIN_ID production
    vercel env add NEXT_PUBLIC_RPC_URL production
    vercel env add NEXT_PUBLIC_API_URL production
    vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID production
    
    # 部署
    vercel --prod
    if [ $? -eq 0 ]; then
        log_info "Deployment successful"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# 驗證部署
verify_deployment() {
    log_info "Verifying deployment..."
    
    # 檢查網站是否可訪問
    if curl -f -s https://dynamicfeepool.com > /dev/null; then
        log_info "Website is accessible"
    else
        log_error "Website is not accessible"
        exit 1
    fi
    
    # 檢查 API 是否可訪問
    if curl -f -s https://api.dynamicfeepool.com/health > /dev/null; then
        log_info "API is accessible"
    else
        log_error "API is not accessible"
        exit 1
    fi
}

# 主函數
main() {
    log_info "Starting frontend deployment..."
    
    check_environment
    install_dependencies
    run_tests
    build_application
    deploy_to_vercel
    verify_deployment
    
    log_info "Frontend deployment completed successfully!"
}

# 執行主函數
main "$@"
```

## 後端部署

### 1. AWS Lambda 配置

```yaml
# serverless.yml
service: dynamicfeepool-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  environment:
    NODE_ENV: ${self:provider.stage}
    DATABASE_URL: ${env:DATABASE_URL}
    REDIS_URL: ${env:REDIS_URL}
    JWT_SECRET: ${env:JWT_SECRET}
    WEB3_RPC_URL: ${env:WEB3_RPC_URL}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:service}-${self:provider.stage}-*"

functions:
  api:
    handler: src/handler.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    environment:
      GRAPH_NODE_URL: ${env:GRAPH_NODE_URL}
      CONTRACT_ADDRESSES: ${env:CONTRACT_ADDRESSES}

plugins:
  - serverless-offline
  - serverless-dynamodb-local
  - serverless-webpack

custom:
  webpack:
    webpackConfig: webpack.config.js
    includeModules: true
  dynamodb:
    start:
      port: 8000
      inMemory: true
      migrate: true
    stages:
      - dev
```

### 2. Docker 配置

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 建置應用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 啟動應用
CMD ["npm", "start"]
```

### 3. Kubernetes 配置

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dynamicfeepool-api
  labels:
    app: dynamicfeepool-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dynamicfeepool-api
  template:
    metadata:
      labels:
        app: dynamicfeepool-api
    spec:
      containers:
      - name: api
        image: dynamicfeepool/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: dynamicfeepool-api-service
spec:
  selector:
    app: dynamicfeepool-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 監控和日誌

### 1. 監控配置

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'dynamicfeepool-api'
    static_configs:
      - targets: ['api.dynamicfeepool.com:9090']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'dynamicfeepool-frontend'
    static_configs:
      - targets: ['frontend.dynamicfeepool.com:9090']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'smart-contracts'
    static_configs:
      - targets: ['contracts.dynamicfeepool.com:9090']
    metrics_path: /metrics
    scrape_interval: 10s
```

### 2. 日誌配置

```javascript
// src/utils/logger.js
const winston = require('winston');
const { Logtail } = require('@logtail/node');

const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// 添加 Logtail 傳輸
logger.add(new winston.transports.Stream({
  stream: logtail
}));

module.exports = logger;
```

### 3. 健康檢查

```javascript
// src/health.js
const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      web3: await checkWeb3(),
      contracts: await checkContracts()
    }
  };
  
  const isHealthy = Object.values(health.services).every(service => service.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase() {
  try {
    // 檢查數據庫連接
    await db.query('SELECT 1');
    return { status: 'healthy', responseTime: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkRedis() {
  try {
    // 檢查 Redis 連接
    await redis.ping();
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkWeb3() {
  try {
    // 檢查 Web3 連接
    const blockNumber = await web3.eth.getBlockNumber();
    return { status: 'healthy', latestBlock: blockNumber };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkContracts() {
  try {
    // 檢查合約連接
    const feeHook = new web3.eth.Contract(abi, contractAddress);
    await feeHook.methods.getCurrentFeeRate(poolId).call();
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

module.exports = router;
```

## 回滾策略

### 1. 智能合約回滾

```bash
#!/bin/bash
# scripts/rollback-contracts.sh

set -e

log_info() {
    echo -e "\033[0;32m[INFO]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# 回滾到上一個版本
rollback_contracts() {
    local previous_version=$1
    
    log_info "Rolling back contracts to version $previous_version"
    
    # 1. 暫停當前合約
    forge script scripts/PauseContracts.sol:PauseContracts \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --broadcast
    
    # 2. 部署上一個版本
    forge script scripts/DeployProtocol.sol:DeployProtocol \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --broadcast \
        --verify
    
    # 3. 更新前端配置
    update_frontend_config $previous_version
    
    # 4. 更新 API 配置
    update_api_config $previous_version
    
    log_info "Rollback completed successfully"
}

# 更新前端配置
update_frontend_config() {
    local version=$1
    
    log_info "Updating frontend configuration..."
    
    # 更新合約地址
    vercel env add CONTRACT_ADDRESSES production --value "$(get_contract_addresses $version)"
    
    # 重新部署前端
    vercel --prod
}

# 更新 API 配置
update_api_config() {
    local version=$1
    
    log_info "Updating API configuration..."
    
    # 更新環境變數
    aws lambda update-function-configuration \
        --function-name dynamicfeepool-api \
        --environment Variables="{CONTRACT_ADDRESSES=$(get_contract_addresses $version)}"
    
    # 重新部署 API
    serverless deploy --stage production
}

# 獲取合約地址
get_contract_addresses() {
    local version=$1
    
    # 從部署記錄中獲取合約地址
    cat deployment-reports/$version/contracts.json | jq -r '.contracts'
}

# 主函數
main() {
    if [ $# -eq 0 ]; then
        log_error "Please provide the version to rollback to"
        exit 1
    fi
    
    rollback_contracts $1
}

main "$@"
```

### 2. 前端回滾

```bash
#!/bin/bash
# scripts/rollback-frontend.sh

set -e

log_info() {
    echo -e "\033[0;32m[INFO]\033[0m $1"
}

# 回滾前端到上一個版本
rollback_frontend() {
    local previous_version=$1
    
    log_info "Rolling back frontend to version $previous_version"
    
    # 1. 獲取上一個版本的部署
    local deployment_id=$(vercel deployments list --limit 1 | grep $previous_version | awk '{print $2}')
    
    # 2. 回滾到上一個版本
    vercel rollback $deployment_id --prod
    
    # 3. 驗證回滾
    verify_frontend_deployment
    
    log_info "Frontend rollback completed successfully"
}

# 驗證前端部署
verify_frontend_deployment() {
    log_info "Verifying frontend deployment..."
    
    # 檢查網站是否可訪問
    if curl -f -s https://dynamicfeepool.com > /dev/null; then
        log_info "Frontend is accessible"
    else
        log_error "Frontend is not accessible"
        exit 1
    fi
}

# 主函數
main() {
    if [ $# -eq 0 ]; then
        log_error "Please provide the version to rollback to"
        exit 1
    fi
    
    rollback_frontend $1
}

main "$@"
```

## 部署檢查清單

### 1. 部署前檢查

- [ ] 所有測試通過
- [ ] 代碼審查完成
- [ ] 安全審計通過
- [ ] 環境變數配置正確
- [ ] 合約地址更新
- [ ] 數據庫遷移完成
- [ ] 監控配置就緒

### 2. 部署後檢查

- [ ] 合約部署成功
- [ ] 前端可訪問
- [ ] API 正常響應
- [ ] 數據庫連接正常
- [ ] 監控指標正常
- [ ] 日誌記錄正常
- [ ] 健康檢查通過

### 3. 回滾檢查

- [ ] 回滾計劃準備就緒
- [ ] 上一個版本可用
- [ ] 數據備份完成
- [ ] 監控告警配置
- [ ] 團隊通知準備

這個部署計劃文檔提供了完整的部署策略，包括智能合約、前端和後端的部署流程、監控設置和回滾策略。每個部署階段都有詳細的腳本和配置示例，確保部署過程的可靠性和可重現性。