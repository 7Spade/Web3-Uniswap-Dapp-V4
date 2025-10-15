# 前端組件設計文檔

## 概述

本文檔詳細描述了 DynamicFeePool DApp 的前端組件架構，包括組件設計原則、組件結構、狀態管理和用戶體驗設計。

## 組件架構

### 1. 組件層次結構

```
src/
├── components/
│   ├── Layout/                    # 布局組件
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts
│   ├── PoolManagement/           # 池子管理組件
│   │   ├── PoolList.tsx
│   │   ├── PoolCard.tsx
│   │   ├── PoolDetails.tsx
│   │   ├── CreatePool.tsx
│   │   └── index.ts
│   ├── Governance/               # 治理組件
│   │   ├── ProposalList.tsx
│   │   ├── ProposalCard.tsx
│   │   ├── CreateProposal.tsx
│   │   ├── VoteModal.tsx
│   │   └── index.ts
│   ├── Analytics/                # 分析組件
│   │   ├── Dashboard.tsx
│   │   ├── Charts.tsx
│   │   ├── Metrics.tsx
│   │   └── index.ts
│   ├── Liquidity/                # 流動性組件
│   │   ├── AddLiquidity.tsx
│   │   ├── RemoveLiquidity.tsx
│   │   ├── LiquidityPositions.tsx
│   │   └── index.ts
│   ├── Trading/                  # 交易組件
│   │   ├── SwapInterface.tsx
│   │   ├── TokenSelector.tsx
│   │   ├── PriceChart.tsx
│   │   └── index.ts
│   ├── Common/                   # 通用組件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts
│   └── Web3/                     # Web3 組件
│       ├── WalletConnect.tsx
│       ├── NetworkSelector.tsx
│       ├── TransactionStatus.tsx
│       └── index.ts
```

### 2. 組件設計原則

#### 2.1 單一職責原則
每個組件只負責一個特定功能，保持組件的簡潔性和可維護性。

#### 2.2 可重用性
設計通用的基礎組件，可以在不同場景中重複使用。

#### 2.3 可組合性
組件之間可以靈活組合，形成更複雜的功能。

#### 2.4 響應式設計
所有組件都支援不同螢幕尺寸的響應式設計。

## 核心組件設計

### 1. PoolManagement 組件

#### 1.1 PoolList 組件

```typescript
interface PoolListProps {
  pools: PoolConfig[];
  loading: boolean;
  error: string | null;
  onPoolSelect: (pool: PoolConfig) => void;
  onRefresh: () => void;
  filters: PoolFilter;
  onFilterChange: (filters: PoolFilter) => void;
}

const PoolList: React.FC<PoolListProps> = ({
  pools,
  loading,
  error,
  onPoolSelect,
  onRefresh,
  filters,
  onFilterChange
}) => {
  const [sortBy, setSortBy] = useState<'liquidity' | 'volume' | 'feeRate'>('liquidity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedPools = useMemo(() => {
    return [...pools].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [pools, sortBy, sortOrder]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="pool-list">
      <div className="pool-list-header">
        <h2>動態手續費池</h2>
        <div className="pool-list-controls">
          <FilterControls 
            filters={filters} 
            onFilterChange={onFilterChange} 
          />
          <SortControls 
            sortBy={sortBy} 
            sortOrder={sortOrder}
            onSortChange={setSortBy}
            onOrderChange={setSortOrder}
          />
          <Button onClick={onRefresh} variant="outline">
            刷新
          </Button>
        </div>
      </div>
      
      <div className="pool-grid">
        {sortedPools.map((pool) => (
          <PoolCard
            key={pool.address}
            pool={pool}
            onClick={() => onPoolSelect(pool)}
          />
        ))}
      </div>
    </div>
  );
};
```

#### 1.2 PoolCard 組件

```typescript
interface PoolCardProps {
  pool: PoolConfig;
  onClick: () => void;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, onClick }) => {
  const { data: metrics } = usePoolMetrics(pool.address);
  const { data: feeHistory } = useFeeHistory(pool.address, 7);

  return (
    <Card className="pool-card" onClick={onClick}>
      <CardHeader>
        <div className="pool-tokens">
          <TokenIcon symbol={pool.tokenASymbol} />
          <TokenIcon symbol={pool.tokenBSymbol} />
          <span className="pool-pair">
            {pool.tokenASymbol}/{pool.tokenBSymbol}
          </span>
        </div>
        <div className="pool-status">
          <StatusBadge 
            status={pool.isDynamicFeeEnabled ? 'active' : 'inactive'}
            label={pool.isDynamicFeeEnabled ? '動態手續費' : '固定手續費'}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="pool-metrics">
          <MetricItem
            label="流動性"
            value={formatCurrency(metrics?.currentLiquidity || 0)}
            change={metrics?.liquidityChange24h}
          />
          <MetricItem
            label="24h 交易量"
            value={formatCurrency(metrics?.volume24h || 0)}
            change={metrics?.volumeChange24h}
          />
          <MetricItem
            label="手續費率"
            value={`${pool.currentFeeRate / 100}%`}
            trend={feeHistory?.trend}
          />
        </div>
        
        <div className="pool-chart">
          <MiniChart data={feeHistory?.data} />
        </div>
      </CardContent>
      
      <CardFooter>
        <Button variant="primary" size="sm">
          查看詳情
        </Button>
        <Button variant="outline" size="sm">
          提供流動性
        </Button>
      </CardFooter>
    </Card>
  );
};
```

#### 1.3 PoolDetails 組件

```typescript
interface PoolDetailsProps {
  pool: PoolConfig;
  onClose: () => void;
}

const PoolDetails: React.FC<PoolDetailsProps> = ({ pool, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'governance'>('overview');
  
  const { data: metrics, isLoading: metricsLoading } = usePoolMetrics(pool.address);
  const { data: feeHistory, isLoading: historyLoading } = useFeeHistory(pool.address, 30);
  const { data: liquidityHistory } = useLiquidityHistory(pool.address, 30);

  return (
    <Modal onClose={onClose} size="large">
      <ModalHeader>
        <div className="pool-details-header">
          <div className="pool-info">
            <TokenPair 
              tokenA={pool.tokenASymbol} 
              tokenB={pool.tokenBSymbol} 
              size="large"
            />
            <h2>{pool.tokenASymbol}/{pool.tokenBSymbol}</h2>
          </div>
          <div className="pool-actions">
            <Button variant="outline" size="sm">
              分享
            </Button>
            <Button variant="outline" size="sm">
              收藏
            </Button>
          </div>
        </div>
      </ModalHeader>
      
      <ModalContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">概覽</TabsTrigger>
            <TabsTrigger value="analytics">分析</TabsTrigger>
            <TabsTrigger value="governance">治理</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <PoolOverview 
              pool={pool} 
              metrics={metrics} 
              loading={metricsLoading}
            />
          </TabsContent>
          
          <TabsContent value="analytics">
            <PoolAnalytics 
              pool={pool}
              feeHistory={feeHistory}
              liquidityHistory={liquidityHistory}
              loading={historyLoading}
            />
          </TabsContent>
          
          <TabsContent value="governance">
            <PoolGovernance 
              pool={pool}
            />
          </TabsContent>
        </Tabs>
      </ModalContent>
    </Modal>
  );
};
```

### 2. Governance 組件

#### 2.1 ProposalList 組件

```typescript
interface ProposalListProps {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  onProposalSelect: (proposal: Proposal) => void;
  onCreateProposal: () => void;
}

const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  loading,
  error,
  onProposalSelect,
  onCreateProposal
}) => {
  const [filter, setFilter] = useState<ProposalStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'votingEndTime' | 'votes'>('createdAt');

  const filteredProposals = useMemo(() => {
    let filtered = proposals;
    
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return b.createdAt - a.createdAt;
        case 'votingEndTime':
          return b.votingEndTime - a.votingEndTime;
        case 'votes':
          return b.results.totalVotes - a.results.totalVotes;
        default:
          return 0;
      }
    });
  }, [proposals, filter, sortBy]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="proposal-list">
      <div className="proposal-list-header">
        <h2>治理提案</h2>
        <div className="proposal-list-controls">
          <FilterSelect
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: '全部' },
              { value: ProposalStatus.ACTIVE, label: '進行中' },
              { value: ProposalStatus.SUCCEEDED, label: '已通過' },
              { value: ProposalStatus.DEFEATED, label: '已否決' },
              { value: ProposalStatus.EXECUTED, label: '已執行' }
            ]}
          />
          <SortSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'createdAt', label: '創建時間' },
              { value: 'votingEndTime', label: '投票結束時間' },
              { value: 'votes', label: '投票數' }
            ]}
          />
          <Button onClick={onCreateProposal} variant="primary">
            創建提案
          </Button>
        </div>
      </div>
      
      <div className="proposal-grid">
        {filteredProposals.map((proposal) => (
          <ProposalCard
            key={proposal.proposalId}
            proposal={proposal}
            onClick={() => onProposalSelect(proposal)}
          />
        ))}
      </div>
    </div>
  );
};
```

#### 2.2 ProposalCard 組件

```typescript
interface ProposalCardProps {
  proposal: Proposal;
  onClick: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onClick }) => {
  const { data: userVote } = useUserVote(proposal.proposalId);
  const timeRemaining = useTimeRemaining(proposal.votingEndTime);
  
  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.ACTIVE:
        return 'blue';
      case ProposalStatus.SUCCEEDED:
        return 'green';
      case ProposalStatus.DEFEATED:
        return 'red';
      case ProposalStatus.EXECUTED:
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <Card className="proposal-card" onClick={onClick}>
      <CardHeader>
        <div className="proposal-header">
          <div className="proposal-title">
            <h3>{proposal.title}</h3>
            <StatusBadge 
              status={proposal.status}
              color={getStatusColor(proposal.status)}
            />
          </div>
          <div className="proposal-meta">
            <span className="proposal-id">#{proposal.proposalId}</span>
            <span className="proposal-type">{proposal.type}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="proposal-description">
          <p>{truncateText(proposal.description, 150)}</p>
        </div>
        
        <div className="proposal-metrics">
          <MetricItem
            label="投票數"
            value={proposal.results.totalVotes}
          />
          <MetricItem
            label="參與率"
            value={`${proposal.results.participationRate.toFixed(1)}%`}
          />
          <MetricItem
            label="剩餘時間"
            value={timeRemaining}
          />
        </div>
        
        {proposal.status === ProposalStatus.ACTIVE && (
          <div className="proposal-progress">
            <ProgressBar
              value={proposal.results.actualVoteRate}
              max={100}
              label="投票進度"
            />
          </div>
        )}
        
        {userVote && (
          <div className="user-vote">
            <span className="vote-label">您的投票:</span>
            <span className="vote-option">{userVote.selectedOptions.join(', ')}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button variant="outline" size="sm">
          查看詳情
        </Button>
        {proposal.status === ProposalStatus.ACTIVE && !userVote && (
          <Button variant="primary" size="sm">
            投票
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
```

### 3. Analytics 組件

#### 3.1 Dashboard 組件

```typescript
interface DashboardProps {
  selectedPool?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedPool }) => {
  const { data: globalStats } = useGlobalStats();
  const { data: poolStats } = usePoolStats(selectedPool);
  const { data: topPools } = useTopPools(10);
  const { data: recentActivity } = useRecentActivity();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>分析儀表板</h1>
        <div className="dashboard-controls">
          <PoolSelector 
            value={selectedPool} 
            onChange={(pool) => {/* 處理池子選擇 */}}
          />
          <TimeRangeSelector 
            value="7d" 
            onChange={(range) => {/* 處理時間範圍選擇 */}}
          />
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="stats-grid">
          <StatCard
            title="總流動性"
            value={formatCurrency(globalStats?.totalLiquidity || 0)}
            change={globalStats?.liquidityChange24h}
            icon="liquidity"
          />
          <StatCard
            title="24h 交易量"
            value={formatCurrency(globalStats?.totalVolume24h || 0)}
            change={globalStats?.volumeChange24h}
            icon="volume"
          />
          <StatCard
            title="活躍池子"
            value={globalStats?.activePools || 0}
            change={globalStats?.poolsChange24h}
            icon="pools"
          />
          <StatCard
            title="平均手續費率"
            value={`${globalStats?.averageFeeRate || 0}%`}
            change={globalStats?.feeRateChange24h}
            icon="fees"
          />
        </div>
        
        <div className="charts-grid">
          <div className="chart-container">
            <h3>手續費趨勢</h3>
            <FeeTrendChart data={poolStats?.feeHistory} />
          </div>
          
          <div className="chart-container">
            <h3>流動性變化</h3>
            <LiquidityChart data={poolStats?.liquidityHistory} />
          </div>
          
          <div className="chart-container">
            <h3>交易量分布</h3>
            <VolumeDistributionChart data={topPools} />
          </div>
          
          <div className="chart-container">
            <h3>風險評分</h3>
            <RiskScoreChart data={poolStats?.riskHistory} />
          </div>
        </div>
        
        <div className="tables-grid">
          <div className="table-container">
            <h3>熱門池子</h3>
            <TopPoolsTable data={topPools} />
          </div>
          
          <div className="table-container">
            <h3>最近活動</h3>
            <RecentActivityTable data={recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 4. Common 組件

#### 4.1 Button 組件

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    destructive: 'btn-destructive'
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && 'btn-loading',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {!loading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
    </button>
  );
};
```

#### 4.2 Modal 組件

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={cn('modal', `modal-${size}`)}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            {showCloseButton && (
              <button 
                className="modal-close"
                onClick={onClose}
                aria-label="關閉"
              >
                <XIcon />
              </button>
            )}
          </div>
        )}
        
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};
```

## 狀態管理

### 1. 全局狀態

```typescript
// store/index.ts
export const store = configureStore({
  reducer: {
    pools: poolsSlice.reducer,
    governance: governanceSlice.reducer,
    analytics: analyticsSlice.reducer,
    user: userSlice.reducer,
    web3: web3Slice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 2. 池子狀態

```typescript
// store/poolsSlice.ts
interface PoolsState {
  pools: PoolConfig[];
  selectedPool: string | null;
  loading: boolean;
  error: string | null;
  filters: PoolFilter;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const poolsSlice = createSlice({
  name: 'pools',
  initialState: {
    pools: [],
    selectedPool: null,
    loading: false,
    error: null,
    filters: {},
    sortBy: 'liquidity',
    sortOrder: 'desc'
  } as PoolsState,
  reducers: {
    setPools: (state, action) => {
      state.pools = action.payload;
    },
    setSelectedPool: (state, action) => {
      state.selectedPool = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    }
  }
});
```

## 響應式設計

### 1. 斷點定義

```typescript
// styles/breakpoints.ts
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`
};
```

### 2. 響應式組件

```typescript
// components/ResponsiveGrid.tsx
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = '1rem'
}) => {
  const gridStyle = {
    display: 'grid',
    gap,
    gridTemplateColumns: {
      sm: `repeat(${columns.sm}, 1fr)`,
      md: `repeat(${columns.md}, 1fr)`,
      lg: `repeat(${columns.lg}, 1fr)`,
      xl: `repeat(${columns.xl}, 1fr)`
    }
  };

  return (
    <div className="responsive-grid" style={gridStyle}>
      {children}
    </div>
  );
};
```

## 性能優化

### 1. 代碼分割

```typescript
// 路由級代碼分割
const PoolManagement = lazy(() => import('./PoolManagement'));
const Governance = lazy(() => import('./Governance'));
const Analytics = lazy(() => import('./Analytics'));

// 組件級代碼分割
const PoolDetails = lazy(() => import('./PoolDetails'));
const ProposalDetails = lazy(() => import('./ProposalDetails'));
```

### 2. 虛擬化列表

```typescript
// components/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties }) => React.ReactNode;
}

const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  height,
  itemHeight,
  renderItem
}) => {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {renderItem}
    </List>
  );
};
```

### 3. 記憶化

```typescript
// 使用 React.memo 優化組件
const PoolCard = React.memo<PoolCardProps>(({ pool, onClick }) => {
  // 組件邏輯
});

// 使用 useMemo 優化計算
const sortedPools = useMemo(() => {
  return [...pools].sort((a, b) => {
    return sortOrder === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
  });
}, [pools, sortBy, sortOrder]);

// 使用 useCallback 優化函數
const handlePoolSelect = useCallback((pool: PoolConfig) => {
  onPoolSelect(pool);
}, [onPoolSelect]);
```

這個組件設計文檔提供了完整的前端架構指南，包括組件結構、設計原則、狀態管理和性能優化策略。每個組件都有清晰的接口定義和實現示例，確保開發的一致性和可維護性。