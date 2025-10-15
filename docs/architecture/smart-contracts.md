# 智能合約架構設計

## 概述

本文檔詳細描述了 DynamicFeePool DApp 的智能合約架構，包括合約結構、接口設計、安全機制和部署策略。

## 合約架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    DynamicFeePool Protocol                  │
├─────────────────────────────────────────────────────────────┤
│  Hook Layer (Uniswap V4 Hooks)                             │
│  ├── DynamicFeeHook.sol          ├── LiquidityIncentiveHook.sol │
│  ├── GovernanceHook.sol          └── AnalyticsHook.sol     │
├─────────────────────────────────────────────────────────────┤
│  Core Contract Layer                                        │
│  ├── PoolManager.sol            ├── FeeCalculator.sol      │
│  ├── LiquidityManager.sol       └── RiskManager.sol        │
├─────────────────────────────────────────────────────────────┤
│  Governance Layer                                            │
│  ├── DynamicFeeDAO.sol          ├── ProposalManager.sol    │
│  ├── VotingPower.sol            └── Treasury.sol           │
├─────────────────────────────────────────────────────────────┤
│  Utility Layer                                               │
│  ├── OracleIntegration.sol      ├── TokenManager.sol       │
│  ├── EmergencyManager.sol       └── UpgradeManager.sol     │
└─────────────────────────────────────────────────────────────┘
```

## 核心合約設計

### 1. DynamicFeeHook.sol

動態手續費調整的核心 Hook 合約。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IHook} from "v4-core/interfaces/IHook.sol";
import {BeforeSwapDelta, AfterSwapDelta, SwapParams, SwapResult} from "v4-core/types/SwapParams.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";
import {SafeCast} from "v4-core/libraries/SafeCast.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

contract DynamicFeeHook is IHook, Ownable, ReentrancyGuard, Pausable {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using SafeCast for uint256;

    // 事件定義
    event FeeAdjusted(
        PoolId indexed poolId,
        uint24 oldFee,
        uint24 newFee,
        FeeAdjustmentReason reason,
        uint256 timestamp
    );
    
    event FeeParametersUpdated(
        PoolId indexed poolId,
        uint24 minFee,
        uint24 maxFee,
        uint24 adjustmentStep,
        uint256 cooldownPeriod
    );
    
    event PoolRegistered(
        PoolId indexed poolId,
        address indexed poolManager,
        FeeParameters parameters
    );

    // 結構體定義
    struct FeeParameters {
        uint24 minFee;              // 最小手續費率 (基點)
        uint24 maxFee;              // 最大手續費率 (基點)
        uint24 currentFee;          // 當前手續費率 (基點)
        uint24 adjustmentStep;      // 手續費調整步長 (基點)
        uint256 cooldownPeriod;     // 調整冷卻時間 (秒)
        uint256 lastAdjustment;     // 最後調整時間戳
        bool isActive;              // 是否啟用動態手續費
    }

    struct FeeAdjustmentParams {
        uint256 volumeThreshold;      // 交易量閾值
        uint256 volatilityThreshold;  // 波動性閾值
        uint256 liquidityThreshold;   // 流動性閾值
        uint256 adjustmentFactor;     // 調整係數
        uint256 maxAdjustmentPercent; // 最大調整幅度
    }

    struct PoolMetrics {
        uint256 volume24h;           // 24小時交易量
        uint256 transactions24h;     // 24小時交易筆數
        uint256 currentLiquidity;    // 當前流動性
        uint256 volatility;          // 波動性
        uint256 priceChange24h;      // 24小時價格變化
        uint256 lastUpdateTime;      // 最後更新時間
    }

    enum FeeAdjustmentReason {
        VOLUME_INCREASE,
        VOLUME_DECREASE,
        HIGH_VOLATILITY,
        LOW_VOLATILITY,
        LIQUIDITY_INCREASE,
        LIQUIDITY_DECREASE,
        GOVERNANCE_VOTE,
        EMERGENCY_ADJUSTMENT,
        MANUAL_ADJUSTMENT
    }

    // 狀態變量
    IPoolManager public immutable poolManager;
    
    mapping(PoolId => FeeParameters) public poolFeeParameters;
    mapping(PoolId => FeeAdjustmentParams) public poolAdjustmentParams;
    mapping(PoolId => PoolMetrics) public poolMetrics;
    mapping(PoolId => bool) public registeredPools;
    
    // 全局配置
    uint256 public constant MAX_FEE = 10000; // 100% 最大手續費率
    uint256 public constant MIN_FEE = 1;     // 0.01% 最小手續費率
    uint256 public constant FEE_PRECISION = 10000; // 手續費精度
    
    // 角色定義
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant ANALYTICS_ROLE = keccak256("ANALYTICS_ROLE");

    // 修飾符
    modifier onlyRegisteredPool(PoolId poolId) {
        require(registeredPools[poolId], "Pool not registered");
        _;
    }
    
    modifier onlyFeeManager() {
        require(hasRole(FEE_MANAGER_ROLE, msg.sender), "Not fee manager");
        _;
    }
    
    modifier onlyEmergency() {
        require(hasRole(EMERGENCY_ROLE, msg.sender), "Not emergency role");
        _;
    }

    constructor(address _poolManager) {
        poolManager = IPoolManager(_poolManager);
        
        // 設置默認角色
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(FEE_MANAGER_ROLE, msg.sender);
        _setupRole(EMERGENCY_ROLE, msg.sender);
        _setupRole(ANALYTICS_ROLE, msg.sender);
    }

    // Hook 接口實現
    function getHookPermissions() public pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: false,
            afterAddLiquidity: true,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: true,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: true
        });
    }

    function beforeSwap(
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) external override returns (bytes4) {
        PoolId poolId = key.toId();
        require(registeredPools[poolId], "Pool not registered");
        
        // 檢查是否需要調整手續費
        _checkAndAdjustFee(poolId);
        
        return DynamicFeeHook.beforeSwap.selector;
    }

    function afterSwap(
        PoolKey calldata key,
        SwapParams calldata params,
        SwapResult calldata result,
        bytes calldata hookData
    ) external override returns (bytes4) {
        PoolId poolId = key.toId();
        
        // 更新池子指標
        _updatePoolMetrics(poolId, params, result);
        
        return DynamicFeeHook.afterSwap.selector;
    }

    function afterInitialize(
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        int24 tick,
        bytes calldata hookData
    ) external override returns (bytes4) {
        PoolId poolId = key.toId();
        
        // 初始化池子參數
        _initializePool(poolId, key);
        
        return DynamicFeeHook.afterInitialize.selector;
    }

    // 池子管理函數
    function registerPool(
        PoolId poolId,
        FeeParameters memory parameters,
        FeeAdjustmentParams memory adjustmentParams
    ) external onlyFeeManager {
        require(!registeredPools[poolId], "Pool already registered");
        require(parameters.minFee >= MIN_FEE, "Min fee too low");
        require(parameters.maxFee <= MAX_FEE, "Max fee too high");
        require(parameters.minFee <= parameters.maxFee, "Invalid fee range");
        
        poolFeeParameters[poolId] = parameters;
        poolAdjustmentParams[poolId] = adjustmentParams;
        registeredPools[poolId] = true;
        
        emit PoolRegistered(poolId, address(poolManager), parameters);
    }

    function updateFeeParameters(
        PoolId poolId,
        uint24 minFee,
        uint24 maxFee,
        uint24 adjustmentStep,
        uint256 cooldownPeriod
    ) external onlyFeeManager onlyRegisteredPool(poolId) {
        require(minFee >= MIN_FEE, "Min fee too low");
        require(maxFee <= MAX_FEE, "Max fee too high");
        require(minFee <= maxFee, "Invalid fee range");
        
        FeeParameters storage params = poolFeeParameters[poolId];
        params.minFee = minFee;
        params.maxFee = maxFee;
        params.adjustmentStep = adjustmentStep;
        params.cooldownPeriod = cooldownPeriod;
        
        emit FeeParametersUpdated(poolId, minFee, maxFee, adjustmentStep, cooldownPeriod);
    }

    // 手續費調整函數
    function adjustFeeRate(
        PoolId poolId,
        uint24 newFeeRate,
        FeeAdjustmentReason reason
    ) external onlyFeeManager onlyRegisteredPool(poolId) nonReentrant {
        FeeParameters storage params = poolFeeParameters[poolId];
        
        require(params.isActive, "Dynamic fee not active");
        require(newFeeRate >= params.minFee, "Fee below minimum");
        require(newFeeRate <= params.maxFee, "Fee above maximum");
        require(
            block.timestamp >= params.lastAdjustment + params.cooldownPeriod,
            "Cooldown period not elapsed"
        );
        
        uint24 oldFee = params.currentFee;
        params.currentFee = newFeeRate;
        params.lastAdjustment = block.timestamp;
        
        emit FeeAdjusted(poolId, oldFee, newFeeRate, reason, block.timestamp);
    }

    function calculateSuggestedFeeRate(PoolId poolId) 
        external 
        view 
        onlyRegisteredPool(poolId) 
        returns (uint24) {
        return _calculateDynamicFee(poolId);
    }

    // 內部函數
    function _checkAndAdjustFee(PoolId poolId) internal {
        FeeParameters storage params = poolFeeParameters[poolId];
        
        if (!params.isActive) return;
        if (block.timestamp < params.lastAdjustment + params.cooldownPeriod) return;
        
        uint24 suggestedFee = _calculateDynamicFee(poolId);
        if (suggestedFee != params.currentFee) {
            _adjustFee(poolId, suggestedFee);
        }
    }

    function _calculateDynamicFee(PoolId poolId) internal view returns (uint24) {
        FeeParameters memory params = poolFeeParameters[poolId];
        FeeAdjustmentParams memory adjParams = poolAdjustmentParams[poolId];
        PoolMetrics memory metrics = poolMetrics[poolId];
        
        // 計算調整因子
        int256 adjustmentFactor = _calculateAdjustmentFactor(metrics, adjParams);
        
        // 計算新手續費率
        uint24 newFee = _calculateNewFee(params.currentFee, adjustmentFactor, adjParams);
        
        // 確保在合理範圍內
        return _clampFee(newFee, params.minFee, params.maxFee);
    }

    function _calculateAdjustmentFactor(
        PoolMetrics memory metrics,
        FeeAdjustmentParams memory params
    ) internal pure returns (int256) {
        int256 factor = 0;
        
        // 交易量因子
        if (metrics.volume24h > params.volumeThreshold) {
            factor += int256((metrics.volume24h - params.volumeThreshold) * 100 / params.volumeThreshold) / 10;
        }
        
        // 波動性因子
        if (metrics.volatility > params.volatilityThreshold) {
            factor += int256((metrics.volatility - params.volatilityThreshold) * 100 / params.volatilityThreshold) / 20;
        }
        
        // 流動性因子
        if (metrics.currentLiquidity < params.liquidityThreshold) {
            factor += int256((params.liquidityThreshold - metrics.currentLiquidity) * 100 / params.liquidityThreshold) / 15;
        }
        
        return factor;
    }

    function _calculateNewFee(
        uint24 currentFee,
        int256 adjustmentFactor,
        FeeAdjustmentParams memory params
    ) internal pure returns (uint24) {
        if (adjustmentFactor == 0) return currentFee;
        
        uint256 adjustment = uint256(int256(currentFee) * adjustmentFactor * params.adjustmentFactor / 10000);
        uint256 maxAdjustment = currentFee * params.maxAdjustmentPercent / 10000;
        
        if (adjustment > maxAdjustment) {
            adjustment = maxAdjustment;
        }
        
        if (adjustmentFactor > 0) {
            return uint24(currentFee + adjustment);
        } else {
            return currentFee > adjustment ? uint24(currentFee - adjustment) : 0;
        }
    }

    function _clampFee(uint24 fee, uint24 minFee, uint24 maxFee) internal pure returns (uint24) {
        if (fee < minFee) return minFee;
        if (fee > maxFee) return maxFee;
        return fee;
    }

    function _updatePoolMetrics(
        PoolId poolId,
        SwapParams calldata params,
        SwapResult calldata result
    ) internal {
        PoolMetrics storage metrics = poolMetrics[poolId];
        
        // 更新交易量
        metrics.volume24h += _calculateSwapValue(params, result);
        metrics.transactions24h += 1;
        
        // 更新流動性 (簡化計算)
        // 實際實現中需要從 PoolManager 獲取準確的流動性數據
        
        // 更新價格變化
        // 實際實現中需要計算價格變化
        
        metrics.lastUpdateTime = block.timestamp;
    }

    function _calculateSwapValue(
        SwapParams calldata params,
        SwapResult calldata result
    ) internal pure returns (uint256) {
        // 簡化的交易價值計算
        // 實際實現中需要考慮代幣價格
        return params.amountSpecified > 0 ? 
            uint256(params.amountSpecified) : 
            uint256(-result.amountSpecified);
    }

    function _adjustFee(PoolId poolId, uint24 newFee) internal {
        FeeParameters storage params = poolFeeParameters[poolId];
        uint24 oldFee = params.currentFee;
        
        params.currentFee = newFee;
        params.lastAdjustment = block.timestamp;
        
        emit FeeAdjusted(poolId, oldFee, newFee, FeeAdjustmentReason.VOLUME_INCREASE, block.timestamp);
    }

    function _initializePool(PoolId poolId, PoolKey calldata key) internal {
        // 初始化池子參數
        // 實際實現中需要設置默認參數
    }

    // 緊急函數
    function emergencyAdjustFee(
        PoolId poolId,
        uint24 newFee
    ) external onlyEmergency {
        require(registeredPools[poolId], "Pool not registered");
        
        FeeParameters storage params = poolFeeParameters[poolId];
        uint24 oldFee = params.currentFee;
        
        params.currentFee = newFee;
        params.lastAdjustment = block.timestamp;
        
        emit FeeAdjusted(poolId, oldFee, newFee, FeeAdjustmentReason.EMERGENCY_ADJUSTMENT, block.timestamp);
    }

    function pause() external onlyEmergency {
        _pause();
    }

    function unpause() external onlyEmergency {
        _unpause();
    }

    // 查詢函數
    function getCurrentFeeRate(PoolId poolId) external view returns (uint24) {
        return poolFeeParameters[poolId].currentFee;
    }

    function getPoolParameters(PoolId poolId) external view returns (FeeParameters memory) {
        return poolFeeParameters[poolId];
    }

    function getPoolMetrics(PoolId poolId) external view returns (PoolMetrics memory) {
        return poolMetrics[poolId];
    }

    function canAdjustFee(PoolId poolId) external view returns (bool) {
        FeeParameters memory params = poolFeeParameters[poolId];
        return params.isActive && 
               block.timestamp >= params.lastAdjustment + params.cooldownPeriod;
    }
}
```

### 2. LiquidityIncentiveHook.sol

流動性激勵機制 Hook 合約。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IHook} from "v4-core/interfaces/IHook.sol";
import {BeforeAddLiquidityDelta, AfterAddLiquidityDelta, ModifyLiquidityParams} from "v4-core/types/ModifyLiquidityParams.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LiquidityIncentiveHook is IHook, Ownable, ReentrancyGuard {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using SafeERC20 for IERC20;

    // 事件定義
    event RewardsDistributed(
        PoolId indexed poolId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event Staked(
        address indexed user,
        PoolId indexed poolId,
        uint256 amount,
        uint256 duration,
        uint256 timestamp
    );
    
    event Unstaked(
        address indexed user,
        PoolId indexed poolId,
        uint256 amount,
        uint256 timestamp
    );
    
    event RewardsClaimed(
        address indexed user,
        PoolId indexed poolId,
        uint256 amount,
        uint256 timestamp
    );

    // 結構體定義
    struct StakeInfo {
        uint256 stakedAmount;        // 質押數量
        uint256 stakedAt;            // 質押時間
        uint256 lockDuration;        // 鎖定期限
        uint256 accumulatedRewards;  // 累計獎勵
        uint256 lastClaimedAt;       // 最後領取時間
        uint256 bonusMultiplier;     // 獎勵倍數
    }

    struct MiningPool {
        address rewardToken;         // 獎勵代幣
        uint256 rewardRate;          // 每秒獎勵率
        uint256 totalStaked;         // 總質押量
        uint256 lastUpdateTime;      // 最後更新時間
        uint256 totalRewards;        // 總獎勵
        bool isActive;               // 是否活躍
    }

    // 狀態變量
    IPoolManager public immutable poolManager;
    IERC20 public immutable rewardToken;
    
    mapping(PoolId => MiningPool) public miningPools;
    mapping(address => mapping(PoolId => StakeInfo)) public userStakes;
    mapping(PoolId => bool) public registeredPools;
    
    // 全局配置
    uint256 public constant MAX_LOCK_DURATION = 365 days;
    uint256 public constant MIN_LOCK_DURATION = 7 days;
    uint256 public constant PRECISION = 1e18;

    // 角色定義
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    // 修飾符
    modifier onlyRegisteredPool(PoolId poolId) {
        require(registeredPools[poolId], "Pool not registered");
        _;
    }
    
    modifier onlyRewardManager() {
        require(hasRole(REWARD_MANAGER_ROLE, msg.sender), "Not reward manager");
        _;
    }

    constructor(address _poolManager, address _rewardToken) {
        poolManager = IPoolManager(_poolManager);
        rewardToken = IERC20(_rewardToken);
        
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(REWARD_MANAGER_ROLE, msg.sender);
    }

    // Hook 接口實現
    function getHookPermissions() public pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: true,
            afterAddLiquidity: true,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: true,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: true
        });
    }

    function afterAddLiquidity(
        PoolKey calldata key,
        ModifyLiquidityParams calldata params,
        BeforeAddLiquidityDelta,
        AfterAddLiquidityDelta,
        bytes calldata hookData
    ) external override returns (bytes4) {
        PoolId poolId = key.toId();
        
        if (registeredPools[poolId]) {
            _updateRewards(poolId);
        }
        
        return LiquidityIncentiveHook.afterAddLiquidity.selector;
    }

    function afterRemoveLiquidity(
        PoolKey calldata key,
        ModifyLiquidityParams calldata params,
        BeforeRemoveLiquidityDelta,
        AfterRemoveLiquidityDelta,
        bytes calldata hookData
    ) external override returns (bytes4) {
        PoolId poolId = key.toId();
        
        if (registeredPools[poolId]) {
            _updateRewards(poolId);
        }
        
        return LiquidityIncentiveHook.afterRemoveLiquidity.selector;
    }

    function afterSwap(
        PoolKey calldata key,
        SwapParams calldata params,
        SwapResult calldata result,
        bytes calldata hookData
    ) external override returns (bytes4) {
        PoolId poolId = key.toId();
        
        if (registeredPools[poolId]) {
            _distributeSwapRewards(poolId, params, result);
        }
        
        return LiquidityIncentiveHook.afterSwap.selector;
    }

    // 質押函數
    function stakeLiquidity(
        PoolId poolId,
        uint256 amount,
        uint256 duration
    ) external onlyRegisteredPool(poolId) nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(duration >= MIN_LOCK_DURATION, "Duration too short");
        require(duration <= MAX_LOCK_DURATION, "Duration too long");
        
        // 更新現有獎勵
        _updateUserRewards(msg.sender, poolId);
        
        // 計算獎勵倍數
        uint256 bonusMultiplier = _calculateBonusMultiplier(duration);
        
        // 更新質押信息
        StakeInfo storage stake = userStakes[msg.sender][poolId];
        stake.stakedAmount += amount;
        stake.stakedAt = block.timestamp;
        stake.lockDuration = duration;
        stake.bonusMultiplier = bonusMultiplier;
        
        // 更新礦池總質押量
        MiningPool storage pool = miningPools[poolId];
        pool.totalStaked += amount;
        
        emit Staked(msg.sender, poolId, amount, duration, block.timestamp);
    }

    function unstakeLiquidity(
        PoolId poolId,
        uint256 amount
    ) external onlyRegisteredPool(poolId) nonReentrant {
        StakeInfo storage stake = userStakes[msg.sender][poolId];
        require(stake.stakedAmount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= stake.stakedAt + stake.lockDuration,
            "Lock period not ended"
        );
        
        // 更新獎勵
        _updateUserRewards(msg.sender, poolId);
        
        // 更新質押信息
        stake.stakedAmount -= amount;
        
        // 更新礦池總質押量
        MiningPool storage pool = miningPools[poolId];
        pool.totalStaked -= amount;
        
        emit Unstaked(msg.sender, poolId, amount, block.timestamp);
    }

    function claimRewards(PoolId poolId) external onlyRegisteredPool(poolId) nonReentrant {
        _updateUserRewards(msg.sender, poolId);
        
        StakeInfo storage stake = userStakes[msg.sender][poolId];
        uint256 claimableRewards = stake.accumulatedRewards;
        
        require(claimableRewards > 0, "No rewards to claim");
        
        stake.accumulatedRewards = 0;
        stake.lastClaimedAt = block.timestamp;
        
        rewardToken.safeTransfer(msg.sender, claimableRewards);
        
        emit RewardsClaimed(msg.sender, poolId, claimableRewards, block.timestamp);
    }

    // 管理函數
    function registerMiningPool(
        PoolId poolId,
        address _rewardToken,
        uint256 _rewardRate
    ) external onlyRewardManager {
        require(!registeredPools[poolId], "Pool already registered");
        require(_rewardToken != address(0), "Invalid reward token");
        require(_rewardRate > 0, "Invalid reward rate");
        
        miningPools[poolId] = MiningPool({
            rewardToken: _rewardToken,
            rewardRate: _rewardRate,
            totalStaked: 0,
            lastUpdateTime: block.timestamp,
            totalRewards: 0,
            isActive: true
        });
        
        registeredPools[poolId] = true;
    }

    function updateRewardRate(
        PoolId poolId,
        uint256 newRewardRate
    ) external onlyRewardManager onlyRegisteredPool(poolId) {
        _updateRewards(poolId);
        miningPools[poolId].rewardRate = newRewardRate;
    }

    function addRewards(
        PoolId poolId,
        uint256 amount
    ) external onlyRewardManager onlyRegisteredPool(poolId) {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        miningPools[poolId].totalRewards += amount;
    }

    // 內部函數
    function _updateUserRewards(address user, PoolId poolId) internal {
        _updateRewards(poolId);
        
        StakeInfo storage stake = userStakes[user][poolId];
        if (stake.stakedAmount > 0) {
            uint256 pendingRewards = _calculatePendingRewards(user, poolId);
            stake.accumulatedRewards += pendingRewards;
        }
    }

    function _updateRewards(PoolId poolId) internal {
        MiningPool storage pool = miningPools[poolId];
        if (pool.totalStaked == 0) {
            pool.lastUpdateTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        uint256 rewards = pool.rewardRate * timeElapsed;
        
        pool.totalRewards += rewards;
        pool.lastUpdateTime = block.timestamp;
    }

    function _calculatePendingRewards(address user, PoolId poolId) internal view returns (uint256) {
        StakeInfo memory stake = userStakes[user][poolId];
        MiningPool memory pool = miningPools[poolId];
        
        if (stake.stakedAmount == 0 || pool.totalStaked == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        uint256 totalRewards = pool.rewardRate * timeElapsed;
        uint256 userRewards = totalRewards * stake.stakedAmount / pool.totalStaked;
        
        return userRewards * stake.bonusMultiplier / PRECISION;
    }

    function _calculateBonusMultiplier(uint256 duration) internal pure returns (uint256) {
        // 線性獎勵倍數：1x 到 3x
        return PRECISION + (duration * 2 * PRECISION / MAX_LOCK_DURATION);
    }

    function _distributeSwapRewards(
        PoolId poolId,
        SwapParams calldata params,
        SwapResult calldata result
    ) internal {
        // 根據交易量分配額外獎勵
        uint256 swapValue = _calculateSwapValue(params, result);
        uint256 additionalRewards = swapValue / 1000; // 0.1% 的額外獎勵
        
        if (additionalRewards > 0) {
            MiningPool storage pool = miningPools[poolId];
            pool.totalRewards += additionalRewards;
        }
    }

    function _calculateSwapValue(
        SwapParams calldata params,
        SwapResult calldata result
    ) internal pure returns (uint256) {
        return params.amountSpecified > 0 ? 
            uint256(params.amountSpecified) : 
            uint256(-result.amountSpecified);
    }

    // 查詢函數
    function getStakeInfo(address user, PoolId poolId) external view returns (StakeInfo memory) {
        return userStakes[user][poolId];
    }

    function calculatePendingRewards(address user, PoolId poolId) external view returns (uint256) {
        StakeInfo memory stake = userStakes[user][poolId];
        MiningPool memory pool = miningPools[poolId];
        
        if (stake.stakedAmount == 0 || pool.totalStaked == 0) {
            return stake.accumulatedRewards;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        uint256 totalRewards = pool.rewardRate * timeElapsed;
        uint256 userRewards = totalRewards * stake.stakedAmount / pool.totalStaked;
        uint256 bonusRewards = userRewards * stake.bonusMultiplier / PRECISION;
        
        return stake.accumulatedRewards + bonusRewards;
    }

    function getMiningPoolInfo(PoolId poolId) external view returns (MiningPool memory) {
        return miningPools[poolId];
    }
}
```

### 3. DynamicFeeDAO.sol

DAO 治理合約。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Snapshot} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

contract DynamicFeeDAO is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // 事件定義
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 votes,
        string reason
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        uint256 timestamp
    );
    
    event ProposalCancelled(
        uint256 indexed proposalId,
        address indexed canceller,
        uint256 timestamp
    );

    // 結構體定義
    struct Proposal {
        uint256 proposalId;
        string title;
        string description;
        ProposalType proposalType;
        ProposalStatus status;
        address proposer;
        uint256 createdAt;
        uint256 votingStartTime;
        uint256 votingEndTime;
        uint256 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 totalVotes;
        uint256 totalVotingPower;
        bool executed;
        bytes executionData;
        mapping(address => bool) hasVoted;
        mapping(address => Vote) votes;
    }

    struct Vote {
        bool support;
        uint256 votes;
        string reason;
        uint256 timestamp;
    }

    enum ProposalType {
        FEE_ADJUSTMENT,
        POOL_CREATION,
        POOL_CONFIGURATION,
        PROTOCOL_UPGRADE,
        TREASURY_MANAGEMENT,
        GOVERNANCE_PARAMETERS,
        EMERGENCY_ACTION,
        COMMUNITY_INITIATIVE
    }

    enum ProposalStatus {
        PENDING,
        ACTIVE,
        SUCCEEDED,
        DEFEATED,
        EXECUTED,
        EXPIRED,
        CANCELLED
    }

    // 狀態變量
    IERC20Snapshot public immutable governanceToken;
    TimelockController public immutable timelock;
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // 治理參數
    uint256 public proposalThreshold = 1000e18; // 1000 代幣
    uint256 public votingPeriod = 3 days;
    uint256 public executionDelay = 1 days;
    uint256 public quorumThreshold = 5; // 5%
    uint256 public passingThreshold = 50; // 50%
    
    // 緊急參數
    uint256 public emergencyThreshold = 80; // 80%
    uint256 public emergencyExecutionDelay = 1 hours;
    
    // 角色定義
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    // 修飾符
    modifier onlyProposer() {
        require(hasRole(PROPOSER_ROLE, msg.sender), "Not proposer");
        _;
    }
    
    modifier onlyExecutor() {
        require(hasRole(EXECUTOR_ROLE, msg.sender), "Not executor");
        _;
    }
    
    modifier onlyCanceller() {
        require(hasRole(CANCELLER_ROLE, msg.sender), "Not canceller");
        _;
    }

    constructor(
        address _governanceToken,
        address _timelock,
        address _admin
    ) {
        governanceToken = IERC20Snapshot(_governanceToken);
        timelock = TimelockController(_timelock);
        
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(PROPOSER_ROLE, _admin);
        _setupRole(EXECUTOR_ROLE, _admin);
        _setupRole(CANCELLER_ROLE, _admin);
    }

    // 提案函數
    function propose(
        string memory title,
        string memory description,
        ProposalType proposalType,
        bytes memory executionData
    ) external onlyProposer returns (uint256) {
        require(governanceToken.balanceOf(msg.sender) >= proposalThreshold, "Insufficient voting power");
        
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.proposalId = proposalId;
        proposal.title = title;
        proposal.description = description;
        proposal.proposalType = proposalType;
        proposal.status = ProposalStatus.PENDING;
        proposal.proposer = msg.sender;
        proposal.createdAt = block.timestamp;
        proposal.votingStartTime = block.timestamp;
        proposal.votingEndTime = block.timestamp + votingPeriod;
        proposal.executionData = executionData;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            proposalType,
            proposal.votingStartTime,
            proposal.votingEndTime
        );
        
        return proposalId;
    }

    function castVote(
        uint256 proposalId,
        bool support,
        string memory reason
    ) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp >= proposal.votingStartTime, "Voting not started");
        require(block.timestamp <= proposal.votingEndTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 votingPower = governanceToken.balanceOfAt(msg.sender, proposal.votingStartTime);
        require(votingPower > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = Vote({
            support: support,
            votes: votingPower,
            reason: reason,
            timestamp: block.timestamp
        });
        
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        proposal.totalVotes += votingPower;
        
        emit VoteCast(proposalId, msg.sender, votingPower, reason);
    }

    function executeProposal(uint256 proposalId) external onlyExecutor nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.SUCCEEDED, "Proposal not succeeded");
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.votingEndTime + executionDelay, "Execution delay not elapsed");
        
        proposal.executed = true;
        proposal.executionTime = block.timestamp;
        proposal.status = ProposalStatus.EXECUTED;
        
        // 執行提案
        (bool success,) = address(timelock).call(proposal.executionData);
        require(success, "Execution failed");
        
        emit ProposalExecuted(proposalId, msg.sender, block.timestamp);
    }

    function cancelProposal(uint256 proposalId) external onlyCanceller {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp <= proposal.votingEndTime, "Voting ended");
        
        proposal.status = ProposalStatus.CANCELLED;
        
        emit ProposalCancelled(proposalId, msg.sender, block.timestamp);
    }

    // 內部函數
    function _checkProposalState(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.status != ProposalStatus.ACTIVE) return;
        if (block.timestamp <= proposal.votingEndTime) return;
        
        // 檢查是否達到法定人數
        uint256 totalSupply = governanceToken.totalSupplyAt(proposal.votingStartTime);
        uint256 quorum = totalSupply * quorumThreshold / 100;
        
        if (proposal.totalVotes < quorum) {
            proposal.status = ProposalStatus.DEFEATED;
            return;
        }
        
        // 檢查是否通過
        uint256 supportThreshold = proposal.totalVotes * passingThreshold / 100;
        
        if (proposal.forVotes >= supportThreshold) {
            proposal.status = ProposalStatus.SUCCEEDED;
        } else {
            proposal.status = ProposalStatus.DEFEATED;
        }
    }

    // 管理函數
    function updateGovernanceParameters(
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _quorumThreshold,
        uint256 _passingThreshold
    ) external onlyOwner {
        proposalThreshold = _proposalThreshold;
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        quorumThreshold = _quorumThreshold;
        passingThreshold = _passingThreshold;
    }

    function emergencyExecute(
        uint256 proposalId
    ) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.SUCCEEDED, "Proposal not succeeded");
        require(proposal.forVotes >= proposal.totalVotes * emergencyThreshold / 100, "Not emergency threshold");
        require(block.timestamp >= proposal.votingEndTime + emergencyExecutionDelay, "Emergency delay not elapsed");
        
        proposal.executed = true;
        proposal.executionTime = block.timestamp;
        proposal.status = ProposalStatus.EXECUTED;
        
        (bool success,) = address(timelock).call(proposal.executionData);
        require(success, "Emergency execution failed");
        
        emit ProposalExecuted(proposalId, msg.sender, block.timestamp);
    }

    // 查詢函數
    function getProposal(uint256 proposalId) external view returns (
        uint256 proposalId,
        string memory title,
        string memory description,
        ProposalType proposalType,
        ProposalStatus status,
        address proposer,
        uint256 createdAt,
        uint256 votingStartTime,
        uint256 votingEndTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 totalVotes,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposalId,
            proposal.title,
            proposal.description,
            proposal.proposalType,
            proposal.status,
            proposal.proposer,
            proposal.createdAt,
            proposal.votingStartTime,
            proposal.votingEndTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.totalVotes,
            proposal.executed
        );
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    function getVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return proposals[proposalId].votes[voter];
    }

    function getVotingPower(address voter, uint256 blockNumber) external view returns (uint256) {
        return governanceToken.balanceOfAt(voter, blockNumber);
    }
}
```

## 部署策略

### 1. 部署順序

1. **治理代幣部署**
2. **時間鎖合約部署**
3. **DAO 合約部署**
4. **Hook 合約部署**
5. **池子管理器部署**
6. **金庫合約部署**

### 2. 部署腳本

```solidity
// scripts/DeployProtocol.sol
contract DeployProtocol {
    function deploy() public {
        // 1. 部署治理代幣
        DynamicFeeToken token = new DynamicFeeToken();
        
        // 2. 部署時間鎖
        TimelockController timelock = new TimelockController(
            1 days, // 最小延遲
            [msg.sender], // 管理員
            [msg.sender], // 執行者
            msg.sender // 取消者
        );
        
        // 3. 部署 DAO
        DynamicFeeDAO dao = new DynamicFeeDAO(
            address(token),
            address(timelock),
            msg.sender
        );
        
        // 4. 部署 Hook 合約
        DynamicFeeHook feeHook = new DynamicFeeHook(address(poolManager));
        LiquidityIncentiveHook incentiveHook = new LiquidityIncentiveHook(
            address(poolManager),
            address(token)
        );
        
        // 5. 設置權限
        token.transferOwnership(address(timelock));
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(dao));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(dao));
        
        // 6. 初始化參數
        feeHook.grantRole(feeHook.FEE_MANAGER_ROLE(), address(dao));
        incentiveHook.grantRole(incentiveHook.REWARD_MANAGER_ROLE(), address(dao));
    }
}
```

## 安全考慮

### 1. 審計要點

- **重入攻擊防護**
- **整數溢出檢查**
- **權限控制驗證**
- **時間鎖機制**
- **緊急暫停功能**

### 2. 升級策略

- **代理模式升級**
- **模組化設計**
- **向後兼容性**
- **漸進式遷移**

這個智能合約架構提供了完整的 DynamicFeePool DApp 實現框架，包括動態手續費調整、流動性激勵、DAO 治理等核心功能。每個合約都有清晰的接口定義、安全機制和部署策略，確保系統的可靠性和可維護性。