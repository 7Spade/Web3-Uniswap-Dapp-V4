import WalletConnect from '../features/wallet-connect';
import { AppLogo } from '@/components/icons';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <AppLogo className="h-6 w-6 mr-2" />
          <span className="font-bold">DEX Explorer</span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
