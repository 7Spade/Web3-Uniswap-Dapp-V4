/**
 * 治理系統相關型別定義
 */

export interface Proposal {
  /** 提案 ID */
  proposalId: string;
  /** 提案標題 */
  title: string;
  /** 提案描述 */
  description: string;
  /** 提案類型 */
  type: ProposalType;
  /** 提案狀態 */
  status: ProposalStatus;
  /** 提案創建者 */
  proposer: string;
  /** 提案創建時間 */
  createdAt: number;
  /** 投票開始時間 */
  votingStartTime: number;
  /** 投票結束時間 */
  votingEndTime: number;
  /** 執行時間 */
  executionTime?: number;
  /** 投票選項 */
  options: ProposalOption[];
  /** 投票結果 */
  results: VotingResult;
  /** 執行數據 */
  executionData?: ExecutionData;
  /** 相關池子地址 */
  relatedPools?: string[];
  /** 提案雜湊 */
  proposalHash: string;
  /** 是否已執行 */
  isExecuted: boolean;
  /** 執行交易雜湊 */
  executionTxHash?: string;
}

export enum ProposalType {
  FEE_ADJUSTMENT = 'FEE_ADJUSTMENT',
  POOL_CREATION = 'POOL_CREATION',
  POOL_CONFIGURATION = 'POOL_CONFIGURATION',
  PROTOCOL_UPGRADE = 'PROTOCOL_UPGRADE',
  TREASURY_MANAGEMENT = 'TREASURY_MANAGEMENT',
  GOVERNANCE_PARAMETERS = 'GOVERNANCE_PARAMETERS',
  EMERGENCY_ACTION = 'EMERGENCY_ACTION',
  COMMUNITY_INITIATIVE = 'COMMUNITY_INITIATIVE'
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUCCEEDED = 'SUCCEEDED',
  DEFEATED = 'DEFEATED',
  EXECUTED = 'EXECUTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface ProposalOption {
  /** 選項 ID */
  optionId: string;
  /** 選項描述 */
  description: string;
  /** 選項類型 */
  type: OptionType;
  /** 選項參數 */
  parameters?: Record<string, any>;
}

export enum OptionType {
  YES_NO = 'YES_NO',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  RANKED_CHOICE = 'RANKED_CHOICE',
  CUSTOM = 'CUSTOM'
}

export interface VotingResult {
  /** 總投票數 */
  totalVotes: number;
  /** 總投票權重 */
  totalVotingPower: bigint;
  /** 參與率 (%) */
  participationRate: number;
  /** 選項結果 */
  optionResults: OptionResult[];
  /** 是否通過 */
  isPassed: boolean;
  /** 通過閾值 */
  passingThreshold: number;
  /** 實際得票率 (%) */
  actualVoteRate: number;
}

export interface OptionResult {
  /** 選項 ID */
  optionId: string;
  /** 得票數 */
  voteCount: number;
  /** 得票權重 */
  votingPower: bigint;
  /** 得票率 (%) */
  voteRate: number;
}

export interface ExecutionData {
  /** 目標合約地址 */
  targetContract: string;
  /** 執行函數 */
  functionName: string;
  /** 函數參數 */
  parameters: any[];
  /** 執行值 (ETH) */
  value: bigint;
  /** 是否已執行 */
  isExecuted: boolean;
  /** 執行交易雜湊 */
  txHash?: string;
  /** 執行時間 */
  executedAt?: number;
}

export interface Vote {
  /** 投票 ID */
  voteId: string;
  /** 提案 ID */
  proposalId: string;
  /** 投票者地址 */
  voter: string;
  /** 投票權重 */
  votingPower: bigint;
  /** 選擇的選項 */
  selectedOptions: string[];
  /** 投票時間 */
  timestamp: number;
  /** 投票理由 */
  reason?: string;
  /** 是否委託投票 */
  isDelegated: boolean;
  /** 委託者地址 */
  delegatee?: string;
}

export interface VotingPower {
  /** 用戶地址 */
  user: string;
  /** 代幣餘額 */
  tokenBalance: bigint;
  /** 質押餘額 */
  stakedBalance: bigint;
  /** 委託餘額 */
  delegatedBalance: bigint;
  /** 總投票權重 */
  totalVotingPower: bigint;
  /** 可用投票權重 */
  availableVotingPower: bigint;
  /** 已使用投票權重 */
  usedVotingPower: bigint;
  /** 委託狀態 */
  delegationStatus: DelegationStatus;
  /** 委託者地址 */
  delegatee?: string;
  /** 委託者數量 */
  delegateeCount: number;
}

export enum DelegationStatus {
  NOT_DELEGATED = 'NOT_DELEGATED',
  DELEGATED = 'DELEGATED',
  DELEGATING = 'DELEGATING'
}

export interface Delegation {
  /** 委託 ID */
  delegationId: string;
  /** 委託者地址 */
  delegator: string;
  /** 被委託者地址 */
  delegatee: string;
  /** 委託數量 */
  amount: bigint;
  /** 委託時間 */
  createdAt: number;
  /** 是否活躍 */
  isActive: boolean;
  /** 取消時間 */
  cancelledAt?: number;
}

export interface GovernanceParameters {
  /** 提案創建最小代幣要求 */
  proposalThreshold: bigint;
  /** 投票持續時間 (秒) */
  votingPeriod: number;
  /** 執行延遲時間 (秒) */
  executionDelay: number;
  /** 通過閾值 (%) */
  passingThreshold: number;
  /** 法定人數要求 (%) */
  quorumThreshold: number;
  /** 緊急提案閾值 (%) */
  emergencyThreshold: number;
  /** 緊急提案執行延遲 (秒) */
  emergencyExecutionDelay: number;
  /** 最大提案數量 */
  maxProposals: number;
  /** 提案冷卻時間 (秒) */
  proposalCooldown: number;
}

export interface Treasury {
  /** 金庫地址 */
  address: string;
  /** 總資產價值 (USD) */
  totalValue: bigint;
  /** 資產列表 */
  assets: TreasuryAsset[];
  /** 支出歷史 */
  expenditures: TreasuryExpenditure[];
  /** 收入歷史 */
  revenues: TreasuryRevenue[];
  /** 預算分配 */
  budgetAllocation: BudgetAllocation;
}

export interface TreasuryAsset {
  /** 資產類型 */
  type: 'ETH' | 'ERC20' | 'LP_TOKEN';
  /** 資產地址 */
  address: string;
  /** 資產符號 */
  symbol: string;
  /** 數量 */
  amount: bigint;
  /** 價值 (USD) */
  value: bigint;
  /** 價格 */
  price: bigint;
}

export interface TreasuryExpenditure {
  /** 支出 ID */
  expenditureId: string;
  /** 支出類型 */
  type: ExpenditureType;
  /** 支出金額 */
  amount: bigint;
  /** 支出資產 */
  asset: string;
  /** 接收者地址 */
  recipient: string;
  /** 支出原因 */
  reason: string;
  /** 支出時間 */
  timestamp: number;
  /** 相關提案 ID */
  proposalId?: string;
  /** 交易雜湊 */
  txHash: string;
}

export enum ExpenditureType {
  DEVELOPMENT = 'DEVELOPMENT',
  MARKETING = 'MARKETING',
  SECURITY = 'SECURITY',
  COMMUNITY = 'COMMUNITY',
  OPERATIONS = 'OPERATIONS',
  EMERGENCY = 'EMERGENCY'
}

export interface TreasuryRevenue {
  /** 收入 ID */
  revenueId: string;
  /** 收入類型 */
  type: RevenueType;
  /** 收入金額 */
  amount: bigint;
  /** 收入資產 */
  asset: string;
  /** 收入來源 */
  source: string;
  /** 收入時間 */
  timestamp: number;
  /** 交易雜湊 */
  txHash: string;
}

export enum RevenueType {
  TRADING_FEES = 'TRADING_FEES',
  PROTOCOL_FEES = 'PROTOCOL_FEES',
  TREASURY_INVESTMENT = 'TREASURY_INVESTMENT',
  DONATION = 'DONATION',
  OTHER = 'OTHER'
}

export interface BudgetAllocation {
  /** 總預算 (USD) */
  totalBudget: bigint;
  /** 已分配預算 (USD) */
  allocatedBudget: bigint;
  /** 可用預算 (USD) */
  availableBudget: bigint;
  /** 類別分配 */
  categoryAllocations: CategoryAllocation[];
}

export interface CategoryAllocation {
  /** 類別 */
  category: ExpenditureType;
  /** 分配金額 (USD) */
  amount: bigint;
  /** 分配比例 (%) */
  percentage: number;
  /** 已使用金額 (USD) */
  usedAmount: bigint;
  /** 剩餘金額 (USD) */
  remainingAmount: bigint;
}

export interface GovernanceStats {
  /** 總提案數 */
  totalProposals: number;
  /** 活躍提案數 */
  activeProposals: number;
  /** 已通過提案數 */
  passedProposals: number;
  /** 總投票數 */
  totalVotes: number;
  /** 活躍投票者數 */
  activeVoters: number;
  /** 平均參與率 (%) */
  averageParticipationRate: number;
  /** 總投票權重 */
  totalVotingPower: bigint;
  /** 平均提案執行時間 (秒) */
  averageExecutionTime: number;
}