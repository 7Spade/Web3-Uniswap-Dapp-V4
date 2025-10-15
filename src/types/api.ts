/**
 * API 相關型別定義
 */

// 基礎響應型別
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
}

export interface ApiError {
  code: number;
  message: string;
  details?: Record<string, any>;
}

// 分頁型別
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// 認證型別
export interface AuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// 池子相關型別
export interface PoolListRequest {
  page?: number;
  limit?: number;
  sortBy?: 'liquidity' | 'volume' | 'feeRate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  filters?: PoolFilter;
}

export interface PoolListResponse {
  pools: PoolConfig[];
  pagination: Pagination;
}

export interface PoolDetailsResponse {
  address: string;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  feeParameters: FeeParameters;
  metrics: PoolMetrics;
  feeHistory: FeeAdjustmentRecord[];
  liquidityHistory: LiquidityHistoryRecord[];
  createdAt: number;
  creator: string;
  isActive: boolean;
}

export interface CreatePoolRequest {
  tokenA: string;
  tokenB: string;
  initialFeeRate: number;
  minFeeRate: number;
  maxFeeRate: number;
  feeAdjustmentStep: number;
  feeAdjustmentCooldown: number;
  feeAdjustmentParams: FeeAdjustmentParams;
  enableDynamicFee: boolean;
  name?: string;
  description?: string;
}

export interface CreatePoolResponse {
  poolAddress: string;
  transactionHash: string;
  gasUsed: number;
  gasPrice: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// 治理相關型別
export interface ProposalListRequest {
  page?: number;
  limit?: number;
  status?: ProposalStatus;
  type?: ProposalType;
  sortBy?: 'createdAt' | 'votingEndTime' | 'votes';
  sortOrder?: 'asc' | 'desc';
}

export interface ProposalListResponse {
  proposals: Proposal[];
  pagination: Pagination;
}

export interface ProposalDetailsResponse {
  proposalId: string;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  proposer: string;
  createdAt: number;
  votingStartTime: number;
  votingEndTime: number;
  executionTime?: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  totalVotes: string;
  totalVotingPower: string;
  participationRate: number;
  isExecuted: boolean;
  relatedPools: string[];
  executionData: string;
  votes: Vote[];
}

export interface CreateProposalRequest {
  title: string;
  description: string;
  type: ProposalType;
  executionData: Record<string, any>;
  relatedPools?: string[];
}

export interface CreateProposalResponse {
  proposalId: string;
  transactionHash: string;
  gasUsed: number;
  gasPrice: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface VoteRequest {
  support: boolean;
  votes: string;
  reason?: string;
}

export interface VoteResponse {
  voteId: string;
  transactionHash: string;
  gasUsed: number;
  gasPrice: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// 流動性相關型別
export interface LiquidityPositionsRequest {
  user?: string;
  pool?: string;
  page?: number;
  limit?: number;
}

export interface LiquidityPositionsResponse {
  positions: LiquidityPosition[];
  pagination?: Pagination;
}

export interface AddLiquidityRequest {
  poolAddress: string;
  amountA: string;
  amountB: string;
  slippageTolerance: number;
  deadline: number;
}

export interface AddLiquidityResponse {
  positionId: string;
  transactionHash: string;
  gasUsed: number;
  gasPrice: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface RemoveLiquidityRequest {
  positionId: string;
  amount: string;
  slippageTolerance: number;
  deadline: number;
}

export interface RemoveLiquidityResponse {
  transactionHash: string;
  gasUsed: number;
  gasPrice: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// 分析相關型別
export interface GlobalStatsResponse {
  totalPools: number;
  activePools: number;
  totalLiquidity: string;
  totalVolume24h: string;
  totalFees24h: string;
  averageFeeRate: number;
  mostActivePool: string;
  highestYieldPool: string;
  liquidityChange24h: number;
  volumeChange24h: number;
  feeRateChange24h: number;
}

export interface PoolAnalyticsRequest {
  poolAddress: string;
  period: '1d' | '7d' | '30d' | '90d';
  metrics: ('liquidity' | 'volume' | 'feeRate' | 'price')[];
}

export interface PoolAnalyticsResponse {
  poolAddress: string;
  period: string;
  metrics: {
    liquidity?: {
      current: string;
      change24h: number;
      change7d: number;
      history: HistoryRecord[];
    };
    volume?: {
      current: string;
      change24h: number;
      change7d: number;
      history: HistoryRecord[];
    };
    feeRate?: {
      current: number;
      change24h: number;
      change7d: number;
      history: HistoryRecord[];
    };
    price?: {
      current: string;
      change24h: number;
      change7d: number;
      history: HistoryRecord[];
    };
  };
  riskScore: number;
  recommendations: string[];
}

export interface HistoryRecord {
  timestamp: number;
  value: string | number;
}

// WebSocket 相關型別
export interface WebSocketMessage {
  type: string;
  channel: string;
  data?: any;
}

export interface WebSocketAuthMessage extends WebSocketMessage {
  type: 'auth';
  token: string;
}

export interface WebSocketSubscribeMessage extends WebSocketMessage {
  type: 'subscribe';
  channel: string;
  poolAddress?: string;
  proposalId?: string;
}

export interface WebSocketUnsubscribeMessage extends WebSocketMessage {
  type: 'unsubscribe';
  channel: string;
}

// 池子更新消息
export interface PoolUpdateMessage extends WebSocketMessage {
  type: 'pool_update';
  channel: 'pool_updates';
  data: {
    poolAddress: string;
    currentFeeRate: number;
    liquidity: string;
    volume24h: string;
    transactions24h: number;
    priceChange24h: number;
    timestamp: number;
  };
}

// 提案更新消息
export interface ProposalUpdateMessage extends WebSocketMessage {
  type: 'proposal_update';
  channel: 'proposal_updates';
  data: {
    proposalId: string;
    status: ProposalStatus;
    forVotes: string;
    againstVotes: string;
    totalVotes: string;
    participationRate: number;
    timestamp: number;
  };
}

// 投票更新消息
export interface VoteUpdateMessage extends WebSocketMessage {
  type: 'vote_update';
  channel: 'vote_updates';
  data: {
    proposalId: string;
    voter: string;
    support: boolean;
    votes: string;
    reason?: string;
    timestamp: number;
  };
}

// 錯誤型別
export interface ApiErrorDetails {
  parameter?: string;
  type?: string;
  required?: boolean;
  limit?: number;
  remaining?: number;
  resetTime?: number;
}

// 速率限制型別
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

// 請求配置型別
export interface RequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

// API 客戶端型別
export interface ApiClient {
  // 認證
  authenticate(request: AuthRequest): Promise<AuthResponse>;
  refreshToken(request: RefreshTokenRequest): Promise<AuthResponse>;
  
  // 池子管理
  getPools(request?: PoolListRequest): Promise<PoolListResponse>;
  getPool(address: string): Promise<PoolDetailsResponse>;
  createPool(request: CreatePoolRequest): Promise<CreatePoolResponse>;
  
  // 治理
  getProposals(request?: ProposalListRequest): Promise<ProposalListResponse>;
  getProposal(proposalId: string): Promise<ProposalDetailsResponse>;
  createProposal(request: CreateProposalRequest): Promise<CreateProposalResponse>;
  vote(proposalId: string, request: VoteRequest): Promise<VoteResponse>;
  
  // 流動性管理
  getLiquidityPositions(request?: LiquidityPositionsRequest): Promise<LiquidityPositionsResponse>;
  addLiquidity(request: AddLiquidityRequest): Promise<AddLiquidityResponse>;
  removeLiquidity(request: RemoveLiquidityRequest): Promise<RemoveLiquidityResponse>;
  
  // 分析
  getGlobalStats(): Promise<GlobalStatsResponse>;
  getPoolAnalytics(request: PoolAnalyticsRequest): Promise<PoolAnalyticsResponse>;
  
  // WebSocket
  connectWebSocket(): WebSocket;
  subscribeToPoolUpdates(poolAddress?: string): void;
  subscribeToProposalUpdates(): void;
  subscribeToVoteUpdates(proposalId: string): void;
  unsubscribeFromChannel(channel: string): void;
}

// 工具型別
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ResponseStatus = 'pending' | 'confirmed' | 'failed';

export type WebSocketChannel = 
  | 'pool_updates' 
  | 'proposal_updates' 
  | 'vote_updates' 
  | 'liquidity_updates'
  | 'analytics_updates';

// 常數
export const API_ENDPOINTS = {
  AUTH: {
    TOKEN: '/auth/token',
    REFRESH: '/auth/refresh',
  },
  POOLS: {
    LIST: '/api/v1/pools',
    DETAILS: '/api/v1/pools/{address}',
    CREATE: '/api/v1/pools',
  },
  GOVERNANCE: {
    PROPOSALS: '/api/v1/governance/proposals',
    PROPOSAL_DETAILS: '/api/v1/governance/proposals/{id}',
    VOTE: '/api/v1/governance/proposals/{id}/vote',
  },
  LIQUIDITY: {
    POSITIONS: '/api/v1/liquidity/positions',
    ADD: '/api/v1/liquidity/add',
    REMOVE: '/api/v1/liquidity/remove',
  },
  ANALYTICS: {
    GLOBAL: '/api/v1/analytics/global',
    POOL: '/api/v1/analytics/pools/{address}',
  },
} as const;

export const WEBSOCKET_CHANNELS = {
  POOL_UPDATES: 'pool_updates',
  PROPOSAL_UPDATES: 'proposal_updates',
  VOTE_UPDATES: 'vote_updates',
  LIQUIDITY_UPDATES: 'liquidity_updates',
  ANALYTICS_UPDATES: 'analytics_updates',
} as const;

export const ERROR_CODES = {
  INVALID_REQUEST: 1000,
  MISSING_PARAMETER: 1001,
  INVALID_PARAMETER: 1002,
  UNAUTHORIZED: 1003,
  TOKEN_EXPIRED: 1004,
  INSUFFICIENT_PERMISSIONS: 1005,
  RESOURCE_NOT_FOUND: 1006,
  RESOURCE_CONFLICT: 1007,
  RATE_LIMIT_EXCEEDED: 1008,
  INTERNAL_SERVER_ERROR: 1009,
  SERVICE_UNAVAILABLE: 1010,
} as const;