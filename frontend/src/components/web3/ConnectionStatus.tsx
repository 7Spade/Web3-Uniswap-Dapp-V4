"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const { isConnected, address } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-500">
            Connected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnect()}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          Not Connected
        </Badge>
        <Button
          onClick={() => connect({ connector: connectors[0] })}
          disabled={isPending}
          size="sm"
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </Button>
      </div>
    </div>
  );
}