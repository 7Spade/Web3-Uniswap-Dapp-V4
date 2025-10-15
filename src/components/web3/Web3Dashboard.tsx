"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConnectionStatus } from "./ConnectionStatus";
import { AddressDisplay } from "./AddressDisplay";
import { BalanceDisplay } from "./BalanceDisplay";
import { ChainDisplay } from "./ChainDisplay";

interface Web3DashboardProps {
  className?: string;
}

export function Web3Dashboard({ className }: Web3DashboardProps) {
  const { isConnected } = useAccount();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Web3 Dashboard</CardTitle>
        <CardDescription>
          Manage your Web3 connection and view account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConnectionStatus />
        
        {isConnected && (
          <>
            <Separator />
            <div className="space-y-3">
              <AddressDisplay />
              <BalanceDisplay />
              <ChainDisplay />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}