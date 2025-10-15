// 客戶端專用的 WalletConnect 配置
// 避免 SSR 時的 indexedDB 錯誤

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, sepolia, arbitrum, optimism, polygon, base, linea } from 'wagmi/chains';

// 檢查是否在瀏覽器環境
const isBrowser = typeof window !== 'undefined';

// 項目 ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// 鏈配置
const chains = [mainnet, sepolia, arbitrum, optimism, polygon, base, linea] as const;

// 創建配置
const metadata = {
  name: 'Web3 DApp',
  description: 'Web3 DApp with WalletConnect',
  url: 'https://web3-dapp.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 只有在瀏覽器環境中才創建 Web3Modal
let web3Modal: any = null;

if (isBrowser) {
  const wagmiConfig = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
  });

  web3Modal = createWeb3Modal({
    wagmiConfig,
    projectId,
    enableAnalytics: true,
    enableOnramp: true,
  });
}

export { web3Modal };