# DAO 治理模型設計

## 概述

DynamicFeePool DAO 是一個完全去中心化的自治組織，負責管理協議的發展方向、參數調整和資金分配。本文檔詳細描述了 DAO 的治理架構、投票機制、提案流程和經濟模型。

## 治理架構

### 1. 治理層次結構

```
┌─────────────────────────────────────────────────────────────┐
│                    DynamicFeePool DAO                       │
├─────────────────────────────────────────────────────────────┤
│  Governance Token (DFP)                                     │
│  ├── 投票權重計算    ├── 質押獎勵    ├── 委託機制          │
├─────────────────────────────────────────────────────────────┤
│  Proposal System                                            │
│  ├── 提案創建       ├── 討論期      ├── 投票期            │
│  ├── 執行延遲       ├── 自動執行    ├── 緊急機制          │
├─────────────────────────────────────────────────────────────┤
│  Treasury Management                                        │
│  ├── 資金分配       ├── 預算管理    ├── 支出審計          │
│  ├── 投資決策       ├── 風險控制    ├── 收益分配          │
├─────────────────────────────────────────────────────────────┤
│  Protocol Governance                                        │
│  ├── 參數調整       ├── 功能升級    ├── 安全審計          │
│  ├── 池子管理       ├── 手續費設定  ├── 激勵機制          │
└─────────────────────────────────────────────────────────────┘
```

### 2. 治理代幣 (DFP Token)

#### 2.1 代幣分配

| 類別 | 比例 | 數量 | 鎖定期 | 釋放機制 | 說明 |
|------|------|------|--------|----------|------|
| 社區空投 | 40% | 400M | 無 | 立即 | 早期用戶和流動性提供者 |
| 流動性挖礦 | 30% | 300M | 2年 | 線性釋放 | 流動性提供者獎勵 |
| 團隊 | 20% | 200M | 4年 | 線性釋放 | 開發團隊和顧問 |
| 儲備金 | 10% | 100M | 無 | 治理決定 | 協議發展和應急資金 |

#### 2.2 代幣功能

```solidity
contract DynamicFeeToken is ERC20Snapshot, ERC20Votes, Ownable {
    // 基本功能
    function mint(address to, uint256 amount) external onlyOwner;
    function burn(uint256 amount) external;
    
    // 質押功能
    function stake(uint256 amount, uint256 duration) external;
    function unstake(uint256 amount) external;
    function getStakeInfo(address user) external view returns (StakeInfo memory);
    
    // 委託功能
    function delegate(address delegatee) external;
    function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external;
    
    // 快照功能
    function snapshot() external onlyOwner returns (uint256);
    function getCurrentSnapshotId() external view returns (uint256);
    
    // 治理功能
    function getVotingPower(address account) external view returns (uint256);
    function getVotingPowerAt(address account, uint256 blockNumber) external view returns (uint256);
}
```

### 3. 投票權重計算

#### 3.1 權重計算公式

```solidity
function calculateVotingPower(address user) public view returns (uint256) {
    uint256 tokenBalance = balanceOf(user);
    uint256 stakedBalance = getStakedBalance(user);
    uint256 delegatedBalance = getDelegatedBalance(user);
    uint256 timeWeight = calculateTimeWeight(user);
    
    uint256 basePower = tokenBalance + stakedBalance;
    uint256 bonusPower = basePower * timeWeight / 100;
    uint256 delegatedPower = delegatedBalance;
    
    return basePower + bonusPower + delegatedPower;
}

function calculateTimeWeight(address user) internal view returns (uint256) {
    StakeInfo memory stake = userStakes[user];
    if (stake.amount == 0) return 100; // 基礎權重
    
    uint256 stakingDuration = block.timestamp - stake.stakedAt;
    uint256 lockDuration = stake.lockDuration;
    
    // 時間加權計算
    if (stakingDuration >= lockDuration) {
        return 200; // 最大 200% 權重
    } else {
        return 100 + (stakingDuration * 100 / lockDuration);
    }
}
```

#### 3.2 委託機制

```solidity
contract DelegationManager {
    struct Delegation {
        address delegatee;
        uint256 amount;
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(address => Delegation) public delegations;
    mapping(address => uint256) public delegatedTo;
    mapping(address => address[]) public delegates;
    
    function delegate(address delegatee, uint256 amount) external {
        require(delegatee != msg.sender, "Cannot delegate to self");
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // 取消現有委託
        if (delegations[msg.sender].isActive) {
            _undelegate();
        }
        
        // 創建新委託
        delegations[msg.sender] = Delegation({
            delegatee: delegatee,
            amount: amount,
            timestamp: block.timestamp,
            isActive: true
        });
        
        delegatedTo[delegatee] += amount;
        delegates[delegatee].push(msg.sender);
        
        emit Delegated(msg.sender, delegatee, amount);
    }
    
    function undelegate() external {
        require(delegations[msg.sender].isActive, "No active delegation");
        _undelegate();
    }
    
    function _undelegate() internal {
        Delegation memory delegation = delegations[msg.sender];
        
        delegatedTo[delegation.delegatee] -= delegation.amount;
        delegations[msg.sender].isActive = false;
        
        emit Undelegated(msg.sender, delegation.delegatee, delegation.amount);
    }
}
```

## 提案系統

### 1. 提案類型

#### 1.1 手續費調整提案

```solidity
struct FeeAdjustmentProposal {
    address pool;
    uint24 newFeeRate;
    uint24 minFeeRate;
    uint24 maxFeeRate;
    uint24 adjustmentStep;
    uint256 cooldownPeriod;
    string justification;
}
```

#### 1.2 池子創建提案

```solidity
struct PoolCreationProposal {
    address tokenA;
    address tokenB;
    uint24 initialFeeRate;
    FeeParameters feeParameters;
    string name;
    string description;
    address creator;
}
```

#### 1.3 協議升級提案

```solidity
struct ProtocolUpgradeProposal {
    address newImplementation;
    bytes upgradeData;
    uint256 timelockDelay;
    string description;
    address[] affectedContracts;
}
```

#### 1.4 金庫管理提案

```solidity
struct TreasuryProposal {
    address recipient;
    uint256 amount;
    address token;
    string purpose;
    uint256 duration;
    bool isRecurring;
}
```

### 2. 提案流程

#### 2.1 提案創建

```solidity
function createProposal(
    string memory title,
    string memory description,
    ProposalType proposalType,
    bytes memory proposalData
) external returns (uint256) {
    require(balanceOf(msg.sender) >= proposalThreshold, "Insufficient voting power");
    require(bytes(title).length > 0, "Title cannot be empty");
    require(bytes(description).length >= 100, "Description too short");
    
    uint256 proposalId = proposalCount++;
    Proposal storage proposal = proposals[proposalId];
    
    proposal.proposalId = proposalId;
    proposal.title = title;
    proposal.description = description;
    proposal.proposalType = proposalType;
    proposal.proposer = msg.sender;
    proposal.createdAt = block.timestamp;
    proposal.votingStartTime = block.timestamp + discussionPeriod;
    proposal.votingEndTime = block.timestamp + discussionPeriod + votingPeriod;
    proposal.proposalData = proposalData;
    proposal.status = ProposalStatus.PENDING;
    
    emit ProposalCreated(proposalId, msg.sender, title, proposalType);
    
    return proposalId;
}
```

#### 2.2 投票機制

```solidity
function castVote(
    uint256 proposalId,
    bool support,
    uint256 votes,
    string memory reason
) external {
    Proposal storage proposal = proposals[proposalId];
    require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
    require(block.timestamp >= proposal.votingStartTime, "Voting not started");
    require(block.timestamp <= proposal.votingEndTime, "Voting ended");
    require(!proposal.hasVoted[msg.sender], "Already voted");
    
    uint256 votingPower = getVotingPower(msg.sender);
    require(votes <= votingPower, "Insufficient voting power");
    require(votes > 0, "Votes must be positive");
    
    proposal.hasVoted[msg.sender] = true;
    proposal.votes[msg.sender] = Vote({
        support: support,
        votes: votes,
        reason: reason,
        timestamp: block.timestamp
    });
    
    if (support) {
        proposal.forVotes += votes;
    } else {
        proposal.againstVotes += votes;
    }
    
    proposal.totalVotes += votes;
    
    emit VoteCast(proposalId, msg.sender, votes, reason);
}
```

#### 2.3 提案執行

```solidity
function executeProposal(uint256 proposalId) external {
    Proposal storage proposal = proposals[proposalId];
    require(proposal.status == ProposalStatus.SUCCEEDED, "Proposal not succeeded");
    require(!proposal.executed, "Proposal already executed");
    require(block.timestamp >= proposal.votingEndTime + executionDelay, "Execution delay not elapsed");
    
    proposal.executed = true;
    proposal.executionTime = block.timestamp;
    proposal.status = ProposalStatus.EXECUTED;
    
    // 根據提案類型執行相應操作
    if (proposal.proposalType == ProposalType.FEE_ADJUSTMENT) {
        _executeFeeAdjustment(proposal.proposalData);
    } else if (proposal.proposalType == ProposalType.POOL_CREATION) {
        _executePoolCreation(proposal.proposalData);
    } else if (proposal.proposalType == ProposalType.PROTOCOL_UPGRADE) {
        _executeProtocolUpgrade(proposal.proposalData);
    } else if (proposal.proposalType == ProposalType.TREASURY_MANAGEMENT) {
        _executeTreasuryManagement(proposal.proposalData);
    }
    
    emit ProposalExecuted(proposalId, msg.sender, block.timestamp);
}
```

### 3. 治理參數

| 參數 | 數值 | 說明 |
|------|------|------|
| 提案閾值 | 0.1% | 創建提案所需的最小代幣持有量 |
| 討論期 | 7 天 | 提案創建後的討論時間 |
| 投票期 | 3 天 | 正式投票的持續時間 |
| 執行延遲 | 24 小時 | 提案通過後的執行延遲 |
| 法定人數 | 5% | 通過提案所需的最小投票參與率 |
| 通過閾值 | 50% | 提案通過所需的贊成票比例 |
| 緊急閾值 | 80% | 緊急提案的通過閾值 |
| 緊急執行延遲 | 1 小時 | 緊急提案的執行延遲 |

## 金庫管理

### 1. 金庫結構

```solidity
contract Treasury {
    struct TreasuryAsset {
        address token;
        uint256 amount;
        uint256 value; // USD 價值
        uint256 lastUpdated;
    }
    
    struct BudgetAllocation {
        string category;
        uint256 allocatedAmount;
        uint256 spentAmount;
        uint256 remainingAmount;
        bool isActive;
    }
    
    mapping(string => BudgetAllocation) public budgetAllocations;
    TreasuryAsset[] public assets;
    
    uint256 public totalValue;
    uint256 public availableFunds;
    uint256 public reservedFunds;
}
```

### 2. 資金分配

#### 2.1 預算類別

| 類別 | 比例 | 用途 |
|------|------|------|
| 技術開發 | 40% | 智能合約開發、審計、升級 |
| 市場營銷 | 25% | 品牌推廣、社區建設、合作夥伴 |
| 運營費用 | 20% | 團隊薪資、辦公費用、法律諮詢 |
| 安全基金 | 10% | 安全審計、漏洞賞金、應急資金 |
| 社區獎勵 | 5% | 社區貢獻者獎勵、活動獎金 |

#### 2.2 支出審批

```solidity
function requestExpenditure(
    string memory category,
    address recipient,
    uint256 amount,
    string memory purpose
) external onlyAuthorized {
    require(budgetAllocations[category].isActive, "Category not active");
    require(amount <= budgetAllocations[category].remainingAmount, "Insufficient budget");
    
    ExpenditureRequest memory request = ExpenditureRequest({
        requestId: expenditureRequestCount++,
        category: category,
        recipient: recipient,
        amount: amount,
        purpose: purpose,
        requester: msg.sender,
        createdAt: block.timestamp,
        status: RequestStatus.PENDING
    });
    
    expenditureRequests[request.requestId] = request;
    
    emit ExpenditureRequested(request.requestId, category, recipient, amount);
}
```

### 3. 投資決策

```solidity
contract InvestmentManager {
    struct Investment {
        address asset;
        uint256 amount;
        uint256 expectedReturn;
        uint256 riskLevel;
        uint256 duration;
        address manager;
        bool isActive;
    }
    
    mapping(uint256 => Investment) public investments;
    uint256 public investmentCount;
    
    function proposeInvestment(
        address asset,
        uint256 amount,
        uint256 expectedReturn,
        uint256 riskLevel,
        uint256 duration
    ) external onlyAuthorized returns (uint256) {
        require(amount <= availableFunds, "Insufficient funds");
        require(riskLevel <= 10, "Risk level too high");
        
        uint256 investmentId = investmentCount++;
        investments[investmentId] = Investment({
            asset: asset,
            amount: amount,
            expectedReturn: expectedReturn,
            riskLevel: riskLevel,
            duration: duration,
            manager: msg.sender,
            isActive: true
        });
        
        availableFunds -= amount;
        
        emit InvestmentProposed(investmentId, asset, amount, expectedReturn);
        
        return investmentId;
    }
}
```

## 治理激勵機制

### 1. 投票獎勵

```solidity
contract VotingRewards {
    struct VotingReward {
        uint256 baseReward;
        uint256 participationBonus;
        uint256 earlyVotingBonus;
        uint256 qualityBonus;
    }
    
    function calculateVotingReward(
        address voter,
        uint256 proposalId
    ) external view returns (uint256) {
        Proposal memory proposal = proposals[proposalId];
        Vote memory vote = proposal.votes[voter];
        
        uint256 baseReward = 100e18; // 100 DFP 基礎獎勵
        
        // 參與獎勵
        uint256 participationBonus = 0;
        if (proposal.totalVotes >= quorumThreshold) {
            participationBonus = 50e18; // 50 DFP 參與獎勵
        }
        
        // 早期投票獎勵
        uint256 earlyVotingBonus = 0;
        if (vote.timestamp <= proposal.votingStartTime + 1 days) {
            earlyVotingBonus = 25e18; // 25 DFP 早期投票獎勵
        }
        
        // 質量獎勵（基於投票理由長度）
        uint256 qualityBonus = 0;
        if (bytes(vote.reason).length >= 50) {
            qualityBonus = 25e18; // 25 DFP 質量獎勵
        }
        
        return baseReward + participationBonus + earlyVotingBonus + qualityBonus;
    }
}
```

### 2. 提案獎勵

```solidity
contract ProposalRewards {
    function calculateProposalReward(
        uint256 proposalId
    ) external view returns (uint256) {
        Proposal memory proposal = proposals[proposalId];
        
        uint256 baseReward = 500e18; // 500 DFP 基礎獎勵
        
        // 通過獎勵
        uint256 passingBonus = 0;
        if (proposal.status == ProposalStatus.EXECUTED) {
            passingBonus = 1000e18; // 1000 DFP 通過獎勵
        }
        
        // 參與度獎勵
        uint256 participationBonus = 0;
        if (proposal.totalVotes >= proposal.totalVotingPower * 10 / 100) {
            participationBonus = 500e18; // 500 DFP 參與度獎勵
        }
        
        return baseReward + passingBonus + participationBonus;
    }
}
```

### 3. 質押獎勵

```solidity
contract StakingRewards {
    function calculateStakingReward(
        address user
    ) external view returns (uint256) {
        StakeInfo memory stake = userStakes[user];
        if (stake.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - stake.stakedAt;
        uint256 baseReward = stake.amount * stakingDuration / 365 days;
        
        // 時間加權獎勵
        uint256 timeWeight = 100;
        if (stakingDuration >= 365 days) {
            timeWeight = 200; // 200% 權重
        } else if (stakingDuration >= 180 days) {
            timeWeight = 150; // 150% 權重
        } else if (stakingDuration >= 90 days) {
            timeWeight = 125; // 125% 權重
        }
        
        return baseReward * timeWeight / 100;
    }
}
```

## 治理工具

### 1. 治理儀表板

```typescript
interface GovernanceDashboard {
  // 提案統計
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  failedProposals: number;
  
  // 投票統計
  totalVotes: number;
  averageParticipation: number;
  topVoters: VoterInfo[];
  
  // 金庫統計
  totalTreasuryValue: bigint;
  availableFunds: bigint;
  budgetAllocations: BudgetAllocation[];
  
  // 治理參數
  proposalThreshold: bigint;
  votingPeriod: number;
  executionDelay: number;
  quorumThreshold: number;
  passingThreshold: number;
}
```

### 2. 提案模板

```typescript
interface ProposalTemplate {
  type: ProposalType;
  title: string;
  description: string;
  parameters: Record<string, any>;
  executionData: string;
  estimatedGas: number;
  riskLevel: number;
  impact: string;
  alternatives: string[];
  references: string[];
}
```

### 3. 治理分析

```typescript
interface GovernanceAnalytics {
  // 參與度分析
  participationRate: number;
  voterDistribution: VoterDistribution;
  votingPatterns: VotingPattern[];
  
  // 提案分析
  proposalSuccessRate: number;
  averageExecutionTime: number;
  commonRejectionReasons: string[];
  
  // 金庫分析
  treasuryGrowth: number;
  expenditureEfficiency: number;
  investmentReturns: number;
  
  // 治理健康度
  governanceHealthScore: number;
  decentralizationIndex: number;
  communityEngagement: number;
}
```

## 治理升級

### 1. 漸進式權力下放

```solidity
contract GovernanceUpgrade {
    enum GovernanceStage {
        CENTRALIZED,      // 中心化階段
        SEMI_DECENTRALIZED, // 半去中心化階段
        DECENTRALIZED,    // 去中心化階段
        FULLY_AUTONOMOUS  // 完全自治階段
    }
    
    GovernanceStage public currentStage = GovernanceStage.CENTRALIZED;
    
    function upgradeGovernanceStage() external onlyAuthorized {
        require(canUpgradeStage(), "Upgrade conditions not met");
        
        if (currentStage == GovernanceStage.CENTRALIZED) {
            currentStage = GovernanceStage.SEMI_DECENTRALIZED;
        } else if (currentStage == GovernanceStage.SEMI_DECENTRALIZED) {
            currentStage = GovernanceStage.DECENTRALIZED;
        } else if (currentStage == GovernanceStage.DECENTRALIZED) {
            currentStage = GovernanceStage.FULLY_AUTONOMOUS;
        }
        
        emit GovernanceStageUpgraded(currentStage);
    }
    
    function canUpgradeStage() internal view returns (bool) {
        // 檢查升級條件
        return communityParticipation >= requiredParticipation &&
               treasuryValue >= requiredTreasuryValue &&
               timeElapsed >= requiredTime;
    }
}
```

### 2. 治理模組化

```solidity
contract ModularGovernance {
    mapping(string => address) public governanceModules;
    
    function registerModule(
        string memory moduleName,
        address moduleAddress
    ) external onlyAuthorized {
        governanceModules[moduleName] = moduleAddress;
        emit ModuleRegistered(moduleName, moduleAddress);
    }
    
    function executeModule(
        string memory moduleName,
        bytes memory data
    ) external {
        address module = governanceModules[moduleName];
        require(module != address(0), "Module not found");
        
        (bool success,) = module.delegatecall(data);
        require(success, "Module execution failed");
    }
}
```

## 治理監控

### 1. 治理指標

```typescript
interface GovernanceMetrics {
  // 參與度指標
  voterTurnout: number;
  proposalCreationRate: number;
  averageVotingPower: bigint;
  
  // 效率指標
  averageProposalDuration: number;
  executionSuccessRate: number;
  governanceCost: bigint;
  
  // 去中心化指標
  giniCoefficient: number;
  herfindahlIndex: number;
  topVoterConcentration: number;
  
  // 治理質量指標
  proposalQualityScore: number;
  discussionEngagement: number;
  communitySatisfaction: number;
}
```

### 2. 治理報告

```typescript
interface GovernanceReport {
  period: string;
  summary: string;
  keyMetrics: GovernanceMetrics;
  notableEvents: GovernanceEvent[];
  recommendations: string[];
  nextPeriodGoals: string[];
}
```

這個 DAO 治理模型設計提供了完整的去中心化治理框架，包括代幣經濟學、投票機制、金庫管理、激勵機制和治理工具。通過漸進式權力下放和模組化設計，確保治理系統的可持續發展和社區驅動的決策過程。