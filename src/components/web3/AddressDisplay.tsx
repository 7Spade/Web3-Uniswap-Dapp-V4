"use client";

import { useAccount, useEnsName } from "wagmi";
import { useWindowSize } from "@/hooks/use-mobile";
import { getEllipsisTxt } from "@/lib/web3-utils";

interface AddressDisplayProps {
  className?: string;
}

export function AddressDisplay({ className }: AddressDisplayProps) {
  const { address } = useAccount();
  const { data: ensName, isLoading: isEnsLoading } = useEnsName({ address });
  const { isTablet } = useWindowSize();

  const displayedAddress = isTablet && address ? getEllipsisTxt(address, 4) : address;
  const finalValue = isEnsLoading ? "Loading..." : (ensName ?? displayedAddress);

  return (
    <div className={className}>
      <span className="text-sm font-medium text-muted-foreground">Address:</span>
      <span className="ml-2 font-mono text-sm">{finalValue || "Not connected"}</span>
    </div>
  );
}