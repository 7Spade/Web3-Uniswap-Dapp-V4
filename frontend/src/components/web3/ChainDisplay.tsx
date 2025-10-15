"use client";

import { useAccount, useChainId } from "wagmi";
import { Badge } from "../ui/badge";

interface ChainDisplayProps {
  className?: string;
}

const chainNames: Record<number, string> = {
  1: "Ethereum",
  11155111: "Sepolia",
  137: "Polygon",
  80001: "Mumbai",
  43114: "Avalanche",
  43113: "Fuji",
  10: "Optimism",
  420: "Optimism Goerli",
  42161: "Arbitrum",
  421614: "Arbitrum Goerli",
  59144: "Linea",
  59140: "Linea Testnet",
  8453: "Base",
  84532: "Base Goerli",
  56: "BSC",
  97: "BSC Testnet",
};

export function ChainDisplay({ className }: ChainDisplayProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return (
      <div className={className}>
        <span className="text-sm font-medium text-muted-foreground">Chain:</span>
        <span className="ml-2 text-sm">Not connected</span>
      </div>
    );
  }

  const chainName = chainNames[chainId] || `Chain ${chainId}`;

  return (
    <div className={className}>
      <span className="text-sm font-medium text-muted-foreground">Chain:</span>
      <Badge variant="secondary" className="ml-2">
        {chainName}
      </Badge>
    </div>
  );
}