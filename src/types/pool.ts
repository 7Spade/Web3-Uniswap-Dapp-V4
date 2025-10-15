/**
 * 動態手續費池相關型別定義
 */

export interface PoolConfig {
  /** 池子地址 */
  address: string;
  /** 代幣 A 地址 */
  tokenA: string;
  /** 代幣 B 地址 */
  tokenB: string;
  /** 代幣 A 符號 */
  tokenASymbol: string;
  /** 代幣 B 符號 */
  tokenBSymbol: string;
  /** 代幣 A 小數位數 */
  tokenADecimals: number;
  /** 代幣 B 小數位數 */
  tokenBDecimals: number;
  /** 當前手續費率 (基點) */
  currentFeeRate: number;
  /** 最小手續費率 (基點) */
  minFeeRate: number;
  /** 最大手續費率 (基點) */
  maxFeeRate: number;
  /** 手續費調整步長 (基點) */
  feeAdjustmentStep: number;
  /** 手續費調整冷卻時間 (秒) */
  feeAdjustmentCooldown: number;
  /** 最後手續費調整時間戳 */
  lastFeeAdjustment: number;
  /** 是否啟用動態手續費 */
  isDynamicFeeEnabled: boolean;
  /** 池子創建時間 */
  createdAt: number;
  /** 池子創建者 */
  creator: string;
}

export interface FeeAdjustmentParams {
  /** 交易量閾值 (USD) */
  volumeThreshold: bigint;
  /** 波動性閾值 (%) */
  volatilityThreshold: number;
  /** 流動性閾值 (USD) */
  liquidityThreshold: bigint;
  /** 手續費調整係數 */
  adjustmentFactor: number;
  /** 最大調整幅度 (%) */
  maxAdjustmentPercent: number;
}

export interface PoolMetrics {
  /** 24小時交易量 (USD) */
  volume24h: bigint;
  /** 24小時交易筆數 */
  transactions24h: number;
  /** 當前流動性 (USD) */
  currentLiquidity: bigint;
  /** 7天平均手續費率 (基點) */
  avgFeeRate7d: number;
  /** 30天平均手續費率 (基點) */
  avgFeeRate30d: number;
  /** 當前價格 */
  currentPrice: bigint;
  /** 24小時價格變化 (%) */
  priceChange24h: number;
  /** 7天價格變化 (%) */
  priceChange7d: number;
  /** 30天價格變化 (%) */
  priceChange30d: number;
  /** 無常損失 (%) */
  impermanentLoss: number;
  /** LP 總收益 (USD) */
  totalLPRewards: bigint;
  /** 手續費收入 (USD) */
  feeRevenue: bigint;
}

export interface LiquidityPosition {
  /** 位置 ID */
  positionId: string;
  /** 用戶地址 */
  user: string;
  /** 池子地址 */
  pool: string;
  /** 代幣 A 數量 */
  amountA: bigint;
  /** 代幣 B 數量 */
  amountB: bigint;
  /** 流動性份額 */
  liquidityShares: bigint;
  /** 總流動性份額 */
  totalLiquidityShares: bigint;
  /** 份額比例 (%) */
  sharePercentage: number;
  /** 位置創建時間 */
  createdAt: number;
  /** 最後更新時間 */
  lastUpdated: number;
  /** 累計手續費收益 */
  accumulatedFees: bigint;
  /** 未領取獎勵 */
  unclaimedRewards: bigint;
}

export interface FeeAdjustmentHistory {
  /** 調整 ID */
  adjustmentId: string;
  /** 池子地址 */
  pool: string;
  /** 調整前手續費率 (基點) */
  previousFeeRate: number;
  /** 調整後手續費率 (基點) */
  newFeeRate: number;
  /** 調整原因 */
  reason: FeeAdjustmentReason;
  /** 觸發參數 */
  triggerParams: {
    volume?: bigint;
    volatility?: number;
    liquidity?: bigint;
    priceChange?: number;
  };
  /** 調整時間戳 */
  timestamp: number;
  /** 調整者地址 */
  adjuster: string;
  /** 是否為自動調整 */
  isAutomatic: boolean;
}

export enum FeeAdjustmentReason {
  VOLUME_INCREASE = 'VOLUME_INCREASE',
  VOLUME_DECREASE = 'VOLUME_DECREASE',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
  LIQUIDITY_INCREASE = 'LIQUIDITY_INCREASE',
  LIQUIDITY_DECREASE = 'LIQUIDITY_DECREASE',
  GOVERNANCE_VOTE = 'GOVERNANCE_VOTE',
  EMERGENCY_ADJUSTMENT = 'EMERGENCY_ADJUSTMENT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT'
}

export interface PoolCreationParams {
  /** 代幣 A 地址 */
  tokenA: string;
  /** 代幣 B 地址 */
  tokenB: string;
  /** 初始手續費率 (基點) */
  initialFeeRate: number;
  /** 最小手續費率 (基點) */
  minFeeRate: number;
  /** 最大手續費率 (基點) */
  maxFeeRate: number;
  /** 手續費調整步長 (基點) */
  feeAdjustmentStep: number;
  /** 手續費調整冷卻時間 (秒) */
  feeAdjustmentCooldown: number;
  /** 手續費調整參數 */
  feeAdjustmentParams: FeeAdjustmentParams;
  /** 是否啟用動態手續費 */
  enableDynamicFee: boolean;
  /** 池子名稱 */
  name?: string;
  /** 池子描述 */
  description?: string;
}

export interface PoolStats {
  /** 總池子數量 */
  totalPools: number;
  /** 活躍池子數量 */
  activePools: number;
  /** 總流動性 (USD) */
  totalLiquidity: bigint;
  /** 24小時總交易量 (USD) */
  totalVolume24h: bigint;
  /** 24小時總手續費收入 (USD) */
  totalFees24h: bigint;
  /** 平均手續費率 (基點) */
  averageFeeRate: number;
  /** 最活躍池子 */
  mostActivePool: string;
  /** 最高收益池子 */
  highestYieldPool: string;
}

export interface PoolFilter {
  /** 代幣符號過濾 */
  tokenSymbol?: string;
  /** 最小流動性 (USD) */
  minLiquidity?: bigint;
  /** 最大流動性 (USD) */
  maxLiquidity?: bigint;
  /** 最小手續費率 (基點) */
  minFeeRate?: number;
  /** 最大手續費率 (基點) */
  maxFeeRate?: number;
  /** 是否啟用動態手續費 */
  isDynamicFeeEnabled?: boolean;
  /** 排序方式 */
  sortBy?: 'liquidity' | 'volume' | 'feeRate' | 'createdAt';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 頁面大小 */
  pageSize?: number;
  /** 頁碼 */
  page?: number;
}