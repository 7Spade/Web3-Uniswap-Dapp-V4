"use client";

import { useBlockNumber } from "wagmi";

interface BlockNumberProps {
  className?: string;
}

export function BlockNumber({ className }: BlockNumberProps) {
  const { data: blockNumber, isLoading, isError } = useBlockNumber();

  let displayBlockNumber = "0";
  if (isLoading) displayBlockNumber = "Loading...";
  else if (isError) displayBlockNumber = "Error fetching block number";
  else if (blockNumber) displayBlockNumber = blockNumber.toString();

  return (
    <div className={className}>
      <span className="text-sm font-medium text-muted-foreground">Block Number:</span>
      <span className="ml-2 font-mono text-sm">{displayBlockNumber}</span>
    </div>
  );
}