"use client";

import { useState } from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const walletAddress = "0x1a2b...c3d4";

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
    }, 1000);
  };

  const handleDisconnect = () => setIsConnected(false);

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
                <AvatarImage src="https://picsum.photos/seed/wallet/32/32" alt="Wallet Avatar" data-ai-hint="abstract avatar" />
                <AvatarFallback><Skeleton className="h-full w-full rounded-full" /></AvatarFallback>
            </Avatar>
            <span className="hidden md:inline-block">{walletAddress}</span>
            <span className="md:hidden">Wallet</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? (
        <><Wallet className="mr-2 h-4 w-4 animate-pulse" /> Connecting...</>
      ) : (
        <><Wallet className="mr-2 h-4 w-4" /> Connect Wallet</>
      )}
    </Button>
  );
}
