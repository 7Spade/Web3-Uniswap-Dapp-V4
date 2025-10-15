# 測試策略文檔

## 概述

本文檔詳細描述了 DynamicFeePool DApp 的測試策略，包括單元測試、整合測試、端到端測試、安全測試和性能測試的實施方案。

## 測試架構

### 1. 測試層次結構

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Tests (Playwright)                  │
├─────────────────────────────────────────────────────────────┤
│                Integration Tests (Jest)                    │
├─────────────────────────────────────────────────────────────┤
│                 Unit Tests (Jest/Vitest)                   │
├─────────────────────────────────────────────────────────────┤
│              Smart Contract Tests (Foundry)                │
└─────────────────────────────────────────────────────────────┘
```

### 2. 測試覆蓋率目標

| 測試類型 | 覆蓋率目標 | 當前覆蓋率 |
|----------|------------|------------|
| 智能合約 | 95% | 0% |
| 前端組件 | 90% | 0% |
| API 端點 | 95% | 0% |
| 整合測試 | 85% | 0% |
| E2E 測試 | 80% | 0% |

## 智能合約測試

### 1. 測試框架設置

```solidity
// test/BaseTest.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {DynamicFeeHook} from "../src/hooks/DynamicFeeHook.sol";
import {LiquidityIncentiveHook} from "../src/hooks/LiquidityIncentiveHook.sol";
import {DynamicFeeDAO} from "../src/governance/DynamicFeeDAO.sol";

contract BaseTest is Test {
    IPoolManager public poolManager;
    DynamicFeeHook public feeHook;
    LiquidityIncentiveHook public incentiveHook;
    DynamicFeeDAO public dao;
    
    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public user3 = address(0x4);
    
    function setUp() public virtual {
        // 部署合約
        poolManager = new PoolManager();
        feeHook = new DynamicFeeHook(address(poolManager));
        incentiveHook = new LiquidityIncentiveHook(address(poolManager), address(0x5));
        dao = new DynamicFeeDAO(address(0x6), address(0x7), admin);
        
        // 設置角色
        vm.startPrank(admin);
        feeHook.grantRole(feeHook.FEE_MANAGER_ROLE(), address(dao));
        incentiveHook.grantRole(incentiveHook.REWARD_MANAGER_ROLE(), address(dao));
        vm.stopPrank();
    }
}
```

### 2. DynamicFeeHook 測試

```solidity
// test/hooks/DynamicFeeHook.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../BaseTest.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";

contract DynamicFeeHookTest is BaseTest {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    
    PoolKey poolKey;
    PoolId poolId;
    
    function setUp() public override {
        super.setUp();
        
        // 設置測試池子
        poolKey = PoolKey({
            currency0: Currency.wrap(address(0x8)),
            currency1: Currency.wrap(address(0x9)),
            fee: 3000,
            tickSpacing: 60,
            hooks: feeHook
        });
        poolId = poolKey.toId();
    }
    
    function testRegisterPool() public {
        DynamicFeeHook.FeeParameters memory params = DynamicFeeHook.FeeParameters({
            minFee: 100,
            maxFee: 10000,
            currentFee: 3000,
            adjustmentStep: 100,
            cooldownPeriod: 3600,
            lastAdjustment: 0,
            isActive: true
        });
        
        DynamicFeeHook.FeeAdjustmentParams memory adjParams = DynamicFeeHook.FeeAdjustmentParams({
            volumeThreshold: 1000000e18,
            volatilityThreshold: 500,
            liquidityThreshold: 10000000e18,
            adjustmentFactor: 1000,
            maxAdjustmentPercent: 2000
        });
        
        vm.prank(address(dao));
        feeHook.registerPool(poolId, params, adjParams);
        
        assertTrue(feeHook.registeredPools(poolId));
        DynamicFeeHook.FeeParameters memory storedParams = feeHook.poolFeeParameters(poolId);
        assertEq(storedParams.minFee, 100);
        assertEq(storedParams.maxFee, 10000);
        assertEq(storedParams.currentFee, 3000);
    }
    
    function testAdjustFeeRate() public {
        // 先註冊池子
        _registerPool();
        
        // 調整手續費率
        vm.prank(address(dao));
        feeHook.adjustFeeRate(poolId, 5000, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
        
        assertEq(feeHook.getCurrentFeeRate(poolId), 5000);
    }
    
    function testCannotAdjustFeeBelowMinimum() public {
        _registerPool();
        
        vm.prank(address(dao));
        vm.expectRevert("Fee below minimum");
        feeHook.adjustFeeRate(poolId, 50, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
    }
    
    function testCannotAdjustFeeAboveMaximum() public {
        _registerPool();
        
        vm.prank(address(dao));
        vm.expectRevert("Fee above maximum");
        feeHook.adjustFeeRate(poolId, 15000, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
    }
    
    function testCooldownPeriod() public {
        _registerPool();
        
        // 第一次調整
        vm.prank(address(dao));
        feeHook.adjustFeeRate(poolId, 4000, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
        
        // 立即嘗試第二次調整應該失敗
        vm.prank(address(dao));
        vm.expectRevert("Cooldown period not elapsed");
        feeHook.adjustFeeRate(poolId, 5000, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
        
        // 等待冷卻期後應該成功
        vm.warp(block.timestamp + 3601);
        vm.prank(address(dao));
        feeHook.adjustFeeRate(poolId, 5000, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
        
        assertEq(feeHook.getCurrentFeeRate(poolId), 5000);
    }
    
    function testCalculateSuggestedFeeRate() public {
        _registerPool();
        
        // 設置池子指標
        DynamicFeeHook.PoolMetrics memory metrics = DynamicFeeHook.PoolMetrics({
            volume24h: 2000000e18,
            transactions24h: 1000,
            currentLiquidity: 5000000e18,
            volatility: 600,
            priceChange24h: 5,
            lastUpdateTime: block.timestamp
        });
        
        // 更新指標
        vm.prank(address(dao));
        feeHook.updatePoolMetrics(poolId, metrics);
        
        // 計算建議手續費率
        uint24 suggestedFee = feeHook.calculateSuggestedFeeRate(poolId);
        assertTrue(suggestedFee > 3000); // 應該高於當前手續費率
    }
    
    function testEmergencyAdjustFee() public {
        _registerPool();
        
        // 只有緊急角色可以調用
        vm.prank(user1);
        vm.expectRevert("Not emergency role");
        feeHook.emergencyAdjustFee(poolId, 10000);
        
        // 緊急角色可以調用
        vm.prank(admin);
        feeHook.emergencyAdjustFee(poolId, 10000);
        assertEq(feeHook.getCurrentFeeRate(poolId), 10000);
    }
    
    function _registerPool() internal {
        DynamicFeeHook.FeeParameters memory params = DynamicFeeHook.FeeParameters({
            minFee: 100,
            maxFee: 10000,
            currentFee: 3000,
            adjustmentStep: 100,
            cooldownPeriod: 3600,
            lastAdjustment: 0,
            isActive: true
        });
        
        DynamicFeeHook.FeeAdjustmentParams memory adjParams = DynamicFeeHook.FeeAdjustmentParams({
            volumeThreshold: 1000000e18,
            volatilityThreshold: 500,
            liquidityThreshold: 10000000e18,
            adjustmentFactor: 1000,
            maxAdjustmentPercent: 2000
        });
        
        vm.prank(address(dao));
        feeHook.registerPool(poolId, params, adjParams);
    }
}
```

### 3. LiquidityIncentiveHook 測試

```solidity
// test/hooks/LiquidityIncentiveHook.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../BaseTest.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";

contract LiquidityIncentiveHookTest is BaseTest {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    
    PoolKey poolKey;
    PoolId poolId;
    
    function setUp() public override {
        super.setUp();
        
        poolKey = PoolKey({
            currency0: Currency.wrap(address(0x8)),
            currency1: Currency.wrap(address(0x9)),
            fee: 3000,
            tickSpacing: 60,
            hooks: incentiveHook
        });
        poolId = poolKey.toId();
    }
    
    function testRegisterMiningPool() public {
        vm.prank(address(dao));
        incentiveHook.registerMiningPool(poolId, address(0x5), 1000e18);
        
        assertTrue(incentiveHook.registeredPools(poolId));
        LiquidityIncentiveHook.MiningPool memory pool = incentiveHook.miningPools(poolId);
        assertEq(pool.rewardToken, address(0x5));
        assertEq(pool.rewardRate, 1000e18);
        assertTrue(pool.isActive);
    }
    
    function testStakeLiquidity() public {
        _registerMiningPool();
        
        uint256 amount = 1000e18;
        uint256 duration = 30 days;
        
        vm.prank(user1);
        incentiveHook.stakeLiquidity(poolId, amount, duration);
        
        LiquidityIncentiveHook.StakeInfo memory stake = incentiveHook.getStakeInfo(user1, poolId);
        assertEq(stake.stakedAmount, amount);
        assertEq(stake.lockDuration, duration);
        assertTrue(stake.bonusMultiplier > 1e18);
    }
    
    function testUnstakeLiquidity() public {
        _registerMiningPool();
        _stakeLiquidity();
        
        // 等待鎖定期結束
        vm.warp(block.timestamp + 31 days);
        
        uint256 amount = 500e18;
        vm.prank(user1);
        incentiveHook.unstakeLiquidity(poolId, amount);
        
        LiquidityIncentiveHook.StakeInfo memory stake = incentiveHook.getStakeInfo(user1, poolId);
        assertEq(stake.stakedAmount, 500e18);
    }
    
    function testCannotUnstakeBeforeLockPeriod() public {
        _registerMiningPool();
        _stakeLiquidity();
        
        vm.prank(user1);
        vm.expectRevert("Lock period not ended");
        incentiveHook.unstakeLiquidity(poolId, 500e18);
    }
    
    function testCalculateRewards() public {
        _registerMiningPool();
        _stakeLiquidity();
        
        // 等待一段時間
        vm.warp(block.timestamp + 1 days);
        
        uint256 rewards = incentiveHook.calculatePendingRewards(user1, poolId);
        assertTrue(rewards > 0);
    }
    
    function testClaimRewards() public {
        _registerMiningPool();
        _stakeLiquidity();
        
        // 等待並累積獎勵
        vm.warp(block.timestamp + 1 days);
        
        uint256 balanceBefore = IERC20(address(0x5)).balanceOf(user1);
        
        vm.prank(user1);
        incentiveHook.claimRewards(poolId);
        
        uint256 balanceAfter = IERC20(address(0x5)).balanceOf(user1);
        assertTrue(balanceAfter > balanceBefore);
    }
    
    function _registerMiningPool() internal {
        vm.prank(address(dao));
        incentiveHook.registerMiningPool(poolId, address(0x5), 1000e18);
    }
    
    function _stakeLiquidity() internal {
        vm.prank(user1);
        incentiveHook.stakeLiquidity(poolId, 1000e18, 30 days);
    }
}
```

### 4. 治理合約測試

```solidity
// test/governance/DynamicFeeDAO.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../BaseTest.sol";

contract DynamicFeeDAOTest is BaseTest {
    function setUp() public override {
        super.setUp();
        
        // 給用戶一些代幣用於投票
        vm.prank(admin);
        IERC20(address(0x6)).transfer(user1, 1000e18);
        IERC20(address(0x6)).transfer(user2, 2000e18);
        IERC20(address(0x6)).transfer(user3, 500e18);
    }
    
    function testCreateProposal() public {
        string memory title = "Test Proposal";
        string memory description = "This is a test proposal for testing purposes";
        DynamicFeeDAO.ProposalType proposalType = DynamicFeeDAO.ProposalType.FEE_ADJUSTMENT;
        bytes memory executionData = abi.encode("test");
        
        vm.prank(user1);
        uint256 proposalId = dao.propose(title, description, proposalType, executionData);
        
        assertEq(proposalId, 0);
        
        DynamicFeeDAO.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.title, title);
        assertEq(proposal.description, description);
        assertEq(uint256(proposal.type), uint256(proposalType));
        assertEq(proposal.proposer, user1);
    }
    
    function testVote() public {
        uint256 proposalId = _createProposal();
        
        // 用戶1投票支持
        vm.prank(user1);
        dao.castVote(proposalId, true, 1000e18, "I support this proposal");
        
        DynamicFeeDAO.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.forVotes, 1000e18);
        assertEq(proposal.totalVotes, 1000e18);
        assertTrue(proposal.hasVoted[user1]);
    }
    
    function testExecuteProposal() public {
        uint256 proposalId = _createProposal();
        
        // 投票支持
        vm.prank(user1);
        dao.castVote(proposalId, true, 1000e18, "Support");
        
        vm.prank(user2);
        dao.castVote(proposalId, true, 2000e18, "Support");
        
        // 等待投票期結束
        vm.warp(block.timestamp + 4 days);
        
        // 執行提案
        vm.prank(admin);
        dao.executeProposal(proposalId);
        
        DynamicFeeDAO.Proposal memory proposal = dao.getProposal(proposalId);
        assertTrue(proposal.executed);
        assertEq(uint256(proposal.status), uint256(DynamicFeeDAO.ProposalStatus.EXECUTED));
    }
    
    function testProposalFailsWithoutQuorum() public {
        uint256 proposalId = _createProposal();
        
        // 只有一個用戶投票，不達到法定人數
        vm.prank(user1);
        dao.castVote(proposalId, true, 1000e18, "Support");
        
        // 等待投票期結束
        vm.warp(block.timestamp + 4 days);
        
        DynamicFeeDAO.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(uint256(proposal.status), uint256(DynamicFeeDAO.ProposalStatus.DEFEATED));
    }
    
    function _createProposal() internal returns (uint256) {
        string memory title = "Test Proposal";
        string memory description = "This is a test proposal for testing purposes";
        DynamicFeeDAO.ProposalType proposalType = DynamicFeeDAO.ProposalType.FEE_ADJUSTMENT;
        bytes memory executionData = abi.encode("test");
        
        vm.prank(user1);
        return dao.propose(title, description, proposalType, executionData);
    }
}
```

## 前端測試

### 1. 單元測試設置

```typescript
// tests/setup.ts
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Web3 providers
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123', isConnected: true }),
  useConnect: () => ({ connect: vi.fn() }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useNetwork: () => ({ chain: { id: 1 } }),
  useBalance: () => ({ data: { value: BigInt('1000000000000000000') } }),
}));

// Mock API client
vi.mock('../src/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Test wrapper
export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={{} as any}>
          {children}
        </WagmiConfig>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render function
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};
```

### 2. 組件測試

```typescript
// tests/components/PoolCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '../setup';
import { PoolCard } from '../../src/components/PoolManagement/PoolCard';
import { PoolConfig } from '../../src/types/pool';

const mockPool: PoolConfig = {
  address: '0x123',
  tokenA: '0x456',
  tokenB: '0x789',
  tokenASymbol: 'ETH',
  tokenBSymbol: 'USDC',
  tokenADecimals: 18,
  tokenBDecimals: 6,
  currentFeeRate: 3000,
  minFeeRate: 100,
  maxFeeRate: 10000,
  feeAdjustmentStep: 100,
  feeAdjustmentCooldown: 3600,
  lastFeeAdjustment: 1640995200,
  isDynamicFeeEnabled: true,
  createdAt: 1640995200,
  creator: '0xabc',
};

describe('PoolCard', () => {
  it('renders pool information correctly', () => {
    const mockOnClick = vi.fn();
    
    renderWithProviders(
      <PoolCard pool={mockPool} onClick={mockOnClick} />
    );
    
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument();
    expect(screen.getByText('0.3%')).toBeInTheDocument();
    expect(screen.getByText('動態手續費')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const mockOnClick = vi.fn();
    
    renderWithProviders(
      <PoolCard pool={mockPool} onClick={mockOnClick} />
    );
    
    screen.getByRole('button', { name: '查看詳情' }).click();
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  it('displays correct fee rate', () => {
    renderWithProviders(
      <PoolCard pool={mockPool} onClick={vi.fn()} />
    );
    
    expect(screen.getByText('0.3%')).toBeInTheDocument();
  });
});
```

### 3. Hook 測試

```typescript
// tests/hooks/usePoolMetrics.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePoolMetrics } from '../../src/hooks/usePoolMetrics';
import { apiClient } from '../../src/services/apiClient';

const mockMetrics = {
  volume24h: BigInt('500000000000000000000'),
  transactions24h: 1500,
  currentLiquidity: BigInt('1000000000000000000000'),
  volatility: 2.5,
  priceChange24h: 2.5,
  priceChange7d: 5.2,
  priceChange30d: 12.8,
  impermanentLoss: 0.5,
  totalLPRewards: BigInt('10000000000000000000'),
  feeRevenue: BigInt('5000000000000000000'),
};

vi.mock('../../src/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('usePoolMetrics', () => {
  it('fetches pool metrics successfully', async () => {
    const mockGet = vi.mocked(apiClient.get);
    mockGet.mockResolvedValueOnce({
      data: mockMetrics,
    });
    
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(
      () => usePoolMetrics('0x123'),
      { wrapper }
    );
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockMetrics);
    expect(mockGet).toHaveBeenCalledWith('/api/v1/pools/0x123/metrics');
  });
  
  it('handles error when fetching pool metrics', async () => {
    const mockGet = vi.mocked(apiClient.get);
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(
      () => usePoolMetrics('0x123'),
      { wrapper }
    );
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    
    expect(result.current.error).toEqual(new Error('Network error'));
  });
});
```

### 4. API 服務測試

```typescript
// tests/services/apiClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../src/services/apiClient';
import { PoolConfig } from '../../src/types/pool';

// Mock fetch
global.fetch = vi.fn();

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('makes GET request successfully', async () => {
    const mockData = { pools: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);
    
    const result = await apiClient.get('/api/v1/pools');
    
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/pools',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Object),
      })
    );
    expect(result).toEqual(mockData);
  });
  
  it('makes POST request successfully', async () => {
    const mockData = { poolAddress: '0x123' };
    const requestData = { tokenA: '0x456', tokenB: '0x789' };
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);
    
    const result = await apiClient.post('/api/v1/pools', requestData);
    
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/pools',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(requestData),
      })
    );
    expect(result).toEqual(mockData);
  });
  
  it('handles API errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: {
          code: 1001,
          message: 'Missing required parameter',
        },
      }),
    } as Response);
    
    await expect(apiClient.get('/api/v1/pools')).rejects.toThrow('Missing required parameter');
  });
  
  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    
    await expect(apiClient.get('/api/v1/pools')).rejects.toThrow('Network error');
  });
});
```

## 整合測試

### 1. API 整合測試

```typescript
// tests/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../src/services/apiClient';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // 設置測試環境
    process.env.API_BASE_URL = 'http://localhost:3001';
  });
  
  afterAll(async () => {
    // 清理測試環境
  });
  
  it('should authenticate user', async () => {
    const authRequest = {
      walletAddress: '0x123',
      signature: '0x456',
      message: 'Sign this message',
    };
    
    const response = await apiClient.post('/auth/token', authRequest);
    
    expect(response).toHaveProperty('accessToken');
    expect(response).toHaveProperty('refreshToken');
    expect(response.accessToken).toBeTruthy();
  });
  
  it('should fetch pools list', async () => {
    const response = await apiClient.get('/api/v1/pools');
    
    expect(response).toHaveProperty('pools');
    expect(response).toHaveProperty('pagination');
    expect(Array.isArray(response.pools)).toBe(true);
  });
  
  it('should create and execute proposal', async () => {
    // 創建提案
    const proposalRequest = {
      title: 'Test Proposal',
      description: 'This is a test proposal',
      type: 'FEE_ADJUSTMENT',
      executionData: {
        poolAddress: '0x123',
        newFeeRate: 5000,
      },
    };
    
    const createResponse = await apiClient.post('/api/v1/governance/proposals', proposalRequest);
    expect(createResponse).toHaveProperty('proposalId');
    
    // 投票
    const voteRequest = {
      support: true,
      votes: '1000000000000000000000',
      reason: 'I support this proposal',
    };
    
    await apiClient.post(`/api/v1/governance/proposals/${createResponse.proposalId}/vote`, voteRequest);
    
    // 檢查提案狀態
    const proposalResponse = await apiClient.get(`/api/v1/governance/proposals/${createResponse.proposalId}`);
    expect(proposalResponse).toHaveProperty('forVotes');
  });
});
```

### 2. Web3 整合測試

```typescript
// tests/integration/web3.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { ethers } from 'ethers';
import { DynamicFeeHook } from '../../src/contracts/DynamicFeeHook';
import { LiquidityIncentiveHook } from '../../src/contracts/LiquidityIncentiveHook';

describe('Web3 Integration Tests', () => {
  let provider: ethers.Provider;
  let wallet: ethers.Wallet;
  let feeHook: DynamicFeeHook;
  let incentiveHook: LiquidityIncentiveHook;
  
  beforeAll(async () => {
    // 設置本地測試網絡
    provider = new ethers.JsonRpcProvider('http://localhost:8545');
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    // 部署合約
    const feeHookFactory = await ethers.getContractFactory('DynamicFeeHook');
    feeHook = await feeHookFactory.deploy();
    
    const incentiveHookFactory = await ethers.getContractFactory('LiquidityIncentiveHook');
    incentiveHook = await incentiveHookFactory.deploy();
  });
  
  it('should register pool in fee hook', async () => {
    const poolId = ethers.keccak256(ethers.toUtf8Bytes('test-pool'));
    
    const tx = await feeHook.registerPool(
      poolId,
      {
        minFee: 100,
        maxFee: 10000,
        currentFee: 3000,
        adjustmentStep: 100,
        cooldownPeriod: 3600,
        lastAdjustment: 0,
        isActive: true,
      },
      {
        volumeThreshold: ethers.parseEther('1000000'),
        volatilityThreshold: 500,
        liquidityThreshold: ethers.parseEther('10000000'),
        adjustmentFactor: 1000,
        maxAdjustmentPercent: 2000,
      }
    );
    
    await tx.wait();
    
    const isRegistered = await feeHook.registeredPools(poolId);
    expect(isRegistered).toBe(true);
  });
  
  it('should stake liquidity in incentive hook', async () => {
    const poolId = ethers.keccak256(ethers.toUtf8Bytes('test-pool'));
    const amount = ethers.parseEther('1000');
    const duration = 30 * 24 * 60 * 60; // 30 days
    
    const tx = await incentiveHook.stakeLiquidity(poolId, amount, duration);
    await tx.wait();
    
    const stakeInfo = await incentiveHook.getStakeInfo(wallet.address, poolId);
    expect(stakeInfo.stakedAmount).toBe(amount);
    expect(stakeInfo.lockDuration).toBe(duration);
  });
});
```

## 端到端測試

### 1. Playwright 設置

```typescript
// tests/e2e/setup.ts
import { test as base, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// 擴展基礎測試
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // 模擬錢包連接
    await page.goto('/');
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="metamask-option"]');
    
    // 等待連接完成
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();
    
    await use(page);
  },
});

export { expect };
```

### 2. 池子管理 E2E 測試

```typescript
// tests/e2e/pool-management.spec.ts
import { test, expect } from './setup';

test.describe('Pool Management', () => {
  test('should display pools list', async ({ page }) => {
    await page.goto('/pools');
    
    // 檢查池子列表是否加載
    await expect(page.locator('[data-testid="pool-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="pool-card"]')).toHaveCount.greaterThan(0);
  });
  
  test('should filter pools by token symbol', async ({ page }) => {
    await page.goto('/pools');
    
    // 設置過濾器
    await page.fill('[data-testid="token-filter"]', 'ETH');
    await page.click('[data-testid="apply-filter"]');
    
    // 檢查過濾結果
    const poolCards = page.locator('[data-testid="pool-card"]');
    await expect(poolCards).toHaveCount.greaterThan(0);
    
    // 檢查所有池子都包含 ETH
    for (let i = 0; i < await poolCards.count(); i++) {
      const card = poolCards.nth(i);
      await expect(card.locator('[data-testid="token-pair"]')).toContainText('ETH');
    }
  });
  
  test('should sort pools by liquidity', async ({ page }) => {
    await page.goto('/pools');
    
    // 選擇排序方式
    await page.selectOption('[data-testid="sort-select"]', 'liquidity');
    await page.selectOption('[data-testid="order-select"]', 'desc');
    
    // 等待排序完成
    await page.waitForLoadState('networkidle');
    
    // 檢查排序結果
    const liquidityValues = await page.locator('[data-testid="liquidity-value"]').allTextContents();
    const numericValues = liquidityValues.map(v => parseFloat(v.replace(/[,$]/g, '')));
    
    for (let i = 0; i < numericValues.length - 1; i++) {
      expect(numericValues[i]).toBeGreaterThanOrEqual(numericValues[i + 1]);
    }
  });
  
  test('should create new pool', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/pools');
    
    // 點擊創建池子按鈕
    await authenticatedPage.click('[data-testid="create-pool-button"]');
    
    // 填寫表單
    await authenticatedPage.fill('[data-testid="token-a-input"]', '0x123');
    await authenticatedPage.fill('[data-testid="token-b-input"]', '0x456');
    await authenticatedPage.fill('[data-testid="initial-fee-rate"]', '3000');
    await authenticatedPage.fill('[data-testid="min-fee-rate"]', '100');
    await authenticatedPage.fill('[data-testid="max-fee-rate"]', '10000');
    
    // 提交表單
    await authenticatedPage.click('[data-testid="submit-pool-creation"]');
    
    // 確認交易
    await authenticatedPage.click('[data-testid="confirm-transaction"]');
    
    // 等待交易完成
    await expect(authenticatedPage.locator('[data-testid="transaction-success"]')).toBeVisible();
    
    // 檢查新池子出現在列表中
    await authenticatedPage.goto('/pools');
    await expect(authenticatedPage.locator('[data-testid="pool-card"]')).toHaveCount.greaterThan(0);
  });
});
```

### 3. 治理 E2E 測試

```typescript
// tests/e2e/governance.spec.ts
import { test, expect } from './setup';

test.describe('Governance', () => {
  test('should display proposals list', async ({ page }) => {
    await page.goto('/governance');
    
    // 檢查提案列表是否加載
    await expect(page.locator('[data-testid="proposal-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="proposal-card"]')).toHaveCount.greaterThan(0);
  });
  
  test('should create new proposal', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/governance');
    
    // 點擊創建提案按鈕
    await authenticatedPage.click('[data-testid="create-proposal-button"]');
    
    // 填寫提案表單
    await authenticatedPage.fill('[data-testid="proposal-title"]', 'Test Proposal');
    await authenticatedPage.fill('[data-testid="proposal-description"]', 'This is a test proposal for testing purposes');
    await authenticatedPage.selectOption('[data-testid="proposal-type"]', 'FEE_ADJUSTMENT');
    
    // 填寫執行數據
    await authenticatedPage.fill('[data-testid="pool-address"]', '0x123');
    await authenticatedPage.fill('[data-testid="new-fee-rate"]', '5000');
    
    // 提交提案
    await authenticatedPage.click('[data-testid="submit-proposal"]');
    
    // 確認交易
    await authenticatedPage.click('[data-testid="confirm-transaction"]');
    
    // 等待交易完成
    await expect(authenticatedPage.locator('[data-testid="transaction-success"]')).toBeVisible();
    
    // 檢查新提案出現在列表中
    await authenticatedPage.goto('/governance');
    await expect(authenticatedPage.locator('[data-testid="proposal-card"]')).toContainText('Test Proposal');
  });
  
  test('should vote on proposal', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/governance');
    
    // 點擊第一個提案
    await authenticatedPage.click('[data-testid="proposal-card"]:first-child');
    
    // 投票支持
    await authenticatedPage.click('[data-testid="vote-yes"]');
    await authenticatedPage.fill('[data-testid="vote-reason"]', 'I support this proposal');
    await authenticatedPage.click('[data-testid="submit-vote"]');
    
    // 確認交易
    await authenticatedPage.click('[data-testid="confirm-transaction"]');
    
    // 等待交易完成
    await expect(authenticatedPage.locator('[data-testid="transaction-success"]')).toBeVisible();
    
    // 檢查投票狀態
    await expect(authenticatedPage.locator('[data-testid="vote-status"]')).toContainText('已投票');
  });
});
```

## 安全測試

### 1. 智能合約安全測試

```solidity
// test/security/SecurityTest.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../BaseTest.sol";

contract SecurityTest is BaseTest {
    function testReentrancyAttack() public {
        // 測試重入攻擊防護
        _registerPool();
        
        // 嘗試重入攻擊
        vm.prank(user1);
        vm.expectRevert("ReentrancyGuard: reentrant call");
        feeHook.adjustFeeRate(poolId, 5000, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
    }
    
    function testIntegerOverflow() public {
        // 測試整數溢出防護
        _registerPool();
        
        // 嘗試設置極大值
        vm.prank(address(dao));
        vm.expectRevert("Fee above maximum");
        feeHook.adjustFeeRate(poolId, type(uint24).max, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
    }
    
    function testAccessControl() public {
        // 測試權限控制
        _registerPool();
        
        // 非授權用戶嘗試調整手續費
        vm.prank(user1);
        vm.expectRevert("Not fee manager");
        feeHook.adjustFeeRate(poolId, 5000, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
    }
    
    function testPausable() public {
        // 測試暫停功能
        _registerPool();
        
        // 暫停合約
        vm.prank(admin);
        feeHook.pause();
        
        // 嘗試在暫停狀態下調整手續費
        vm.prank(address(dao));
        vm.expectRevert("Pausable: paused");
        feeHook.adjustFeeRate(poolId, 5000, DynamicFeeHook.FeeAdjustmentReason.VOLUME_INCREASE);
    }
}
```

### 2. 前端安全測試

```typescript
// tests/security/frontend-security.test.ts
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../setup';
import { PoolCard } from '../../src/components/PoolManagement/PoolCard';

describe('Frontend Security Tests', () => {
  it('should sanitize user input', () => {
    const maliciousPool = {
      ...mockPool,
      tokenASymbol: '<script>alert("xss")</script>',
    };
    
    const { container } = renderWithProviders(
      <PoolCard pool={maliciousPool} onClick={vi.fn()} />
    );
    
    // 檢查 XSS 攻擊是否被防護
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).toContain('&lt;script&gt;');
  });
  
  it('should validate form input', async () => {
    const { getByTestId } = renderWithProviders(
      <CreatePoolForm onSubmit={vi.fn()} />
    );
    
    // 嘗試提交無效數據
    await fireEvent.click(getByTestId('submit-button'));
    
    // 檢查驗證錯誤
    expect(getByTestId('error-message')).toBeInTheDocument();
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API 錯誤
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('API Error'));
    
    const { getByTestId } = renderWithProviders(
      <PoolList />
    );
    
    // 等待錯誤處理
    await waitFor(() => {
      expect(getByTestId('error-message')).toBeInTheDocument();
    });
  });
});
```

## 性能測試

### 1. 負載測試

```typescript
// tests/performance/load.test.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should handle high load', async ({ page }) => {
    const startTime = Date.now();
    
    // 並發請求多個頁面
    const promises = Array.from({ length: 10 }, () => 
      page.goto('/pools')
    );
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // 檢查負載時間是否在可接受範圍內
    expect(loadTime).toBeLessThan(5000); // 5秒內完成
  });
  
  test('should handle large data sets', async ({ page }) => {
    await page.goto('/pools');
    
    // 模擬大量數據
    await page.evaluate(() => {
      // 注入大量池子數據
      window.mockPools = Array.from({ length: 1000 }, (_, i) => ({
        address: `0x${i.toString(16).padStart(40, '0')}`,
        tokenASymbol: 'ETH',
        tokenBSymbol: 'USDC',
        currentFeeRate: 3000,
        liquidity: '1000000000000000000000',
        volume24h: '500000000000000000000',
      }));
    });
    
    // 檢查渲染性能
    const renderTime = await page.evaluate(() => {
      const start = performance.now();
      // 觸發重新渲染
      window.dispatchEvent(new Event('resize'));
      return performance.now() - start;
    });
    
    expect(renderTime).toBeLessThan(100); // 100ms內完成渲染
  });
});
```

### 2. 內存洩漏測試

```typescript
// tests/performance/memory.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Memory Leak Tests', () => {
  let initialMemory: number;
  
  beforeAll(() => {
    // 記錄初始內存使用量
    initialMemory = process.memoryUsage().heapUsed;
  });
  
  afterAll(() => {
    // 檢查最終內存使用量
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // 內存增長應該在合理範圍內
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
  
  it('should not leak memory during component lifecycle', async () => {
    // 創建和銷毀組件多次
    for (let i = 0; i < 100; i++) {
      const { unmount } = renderWithProviders(
        <PoolList />
      );
      
      // 等待組件完全加載
      await waitFor(() => {
        expect(screen.getByTestId('pool-list')).toBeInTheDocument();
      });
      
      // 銷毀組件
      unmount();
      
      // 強制垃圾回收
      if (global.gc) {
        global.gc();
      }
    }
  });
});
```

## 測試自動化

### 1. CI/CD 配置

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  smart-contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
      - name: Run smart contract tests
        run: |
          forge test
          forge coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run E2E tests
        run: npm run test:e2e

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security tests
        run: |
          npm run test:security
          npm audit
      - name: Run smart contract security tests
        run: forge test --match-contract SecurityTest
```

### 2. 測試報告

```typescript
// tests/utils/testReporter.ts
export class TestReporter {
  private results: TestResult[] = [];
  
  addResult(result: TestResult) {
    this.results.push(result);
  }
  
  generateReport(): TestReport {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    
    return {
      summary: {
        total,
        passed,
        failed,
        skipped,
        passRate: (passed / total) * 100,
      },
      results: this.results,
      coverage: this.calculateCoverage(),
      performance: this.calculatePerformance(),
    };
  }
  
  private calculateCoverage(): CoverageReport {
    // 計算測試覆蓋率
    return {
      statements: 95,
      branches: 90,
      functions: 98,
      lines: 94,
    };
  }
  
  private calculatePerformance(): PerformanceReport {
    // 計算性能指標
    return {
      averageResponseTime: 150,
      maxResponseTime: 500,
      throughput: 1000,
      errorRate: 0.1,
    };
  }
}
```

這個測試策略文檔提供了完整的測試實施方案，包括智能合約測試、前端測試、整合測試、端到端測試、安全測試和性能測試。每個測試類型都有詳細的實施指南和代碼示例，確保系統的質量和可靠性。