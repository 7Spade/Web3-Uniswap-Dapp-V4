"use client";

import { useAccount, useBalance } from "wagmi";
import { formatBalance } from "@/lib/web3-utils";

interface BalanceDisplayProps {
  className?: string;
}

export function BalanceDisplay({ className }: BalanceDisplayProps) {
  const { address } = useAccount();
  const { data, isLoading, isError } = useBalance({ address });

  let displayBalance = "0";
  if (isLoading) displayBalance = "Loading...";
  else if (isError) displayBalance = "Error fetching balance";
  else if (data?.formatted) displayBalance = `Ξ ${formatBalance(data.formatted)}`;

  return (
    <div className={className}>
      <span className="text-sm font-medium text-muted-foreground">Balance:</span>
      <span className="ml-2 font-mono text-sm">{displayBalance}</span>
    </div>
  );
}