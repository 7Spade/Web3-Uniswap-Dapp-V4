import Header from '../components/layout/header';
import SwapCard from '../components/features/swap-card';
import { Web3Dashboard } from '@/components/web3';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6 gap-6">
        <Web3Dashboard className="w-full max-w-2xl" />
        <SwapCard />
      </main>
    </div>
  );
}
