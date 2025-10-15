import { useEffect, useState } from 'react';
import { web3Modal } from '@/lib/walletConnect';

export const useWalletConnect = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 只在客戶端初始化
    if (typeof window === 'undefined') return;

    const initializeWalletConnect = async () => {
      try {
        if (web3Modal) {
          // 初始化 Web3Modal
          await web3Modal.open();
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('WalletConnect initialization error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initializeWalletConnect();
  }, []);

  return {
    isInitialized,
    error,
    web3Modal: isInitialized ? web3Modal : null,
  };
};