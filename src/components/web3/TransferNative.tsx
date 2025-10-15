"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressInput } from "./AddressInput";
import { useToast } from "@/hooks/use-toast";
import { isAddress, parseEther } from "viem";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";

interface TransferNativeProps {
  className?: string;
}

export function TransferNative({ className }: TransferNativeProps) {
  const {
    data,
    error,
    isPending,
    isError,
    sendTransaction,
    reset: resetTransaction,
  } = useSendTransaction();
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({
    hash: data,
  });
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("0");
  const [receiver, setReceiver] = useState<string>("");
  const [hasShownError, setHasShownError] = useState<boolean>(false);
  const [hasShownSuccess, setHasShownSuccess] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setAmount("0");
    setReceiver("");
    setHasShownError(false);
    setHasShownSuccess(false);
  }, []);

  const resetAll = useCallback(() => {
    resetData();
    if (resetTransaction) resetTransaction();
  }, [resetData, resetTransaction]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setHasShownError(false);
    setHasShownSuccess(false);
  };

  const handleTransfer = () => {
    if (receiver.length === 0 || !isAddress(receiver)) {
      return toast({
        title: "Error",
        description: "The receiver address is not set!",
        variant: "destructive",
      });
    }

    if (parseFloat(amount) <= 0) {
      return toast({
        title: "Error",
        description: "The amount to send must be greater than 0.",
        variant: "destructive",
      });
    }

    resetAll();
    sendTransaction({ to: receiver, value: parseEther(amount) });
  };

  useEffect(() => {
    if (receipt && !hasShownSuccess) {
      try {
        toast({
          title: "Transfer successfully sent!",
          description: `Hash: ${receipt.transactionHash || "Unknown"}`,
        });
        setHasShownSuccess(true);
        setAmount("0");
        setReceiver("");
      } catch (err) {
        console.error("Error processing receipt:", err);
      }

      // Schedule reset of transaction data after notification is shown
      setTimeout(() => {
        if (resetTransaction) resetTransaction();
      }, 100);
    }

    if (isError && error && !hasShownError) {
      // Ensure we have a string message
      const errorMessage = typeof error.message === "string" ? error.message : "Transaction failed";

      toast({
        title: "An error occurred",
        description: errorMessage,
        variant: "destructive",
      });
      setHasShownError(true);

      // Schedule reset of transaction data after notification is shown
      setTimeout(() => {
        if (resetTransaction) resetTransaction();
      }, 100);
    }
  }, [
    receipt,
    isError,
    error,
    toast,
    hasShownError,
    hasShownSuccess,
    resetTransaction,
  ]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Transfer Native Token</CardTitle>
        <CardDescription>
          Send native tokens (ETH) to another address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddressInput
          value={receiver}
          onChange={(value) => {
            setReceiver(value);
            setHasShownError(false);
            setHasShownSuccess(false);

            // Clear any previous transaction data
            if (resetTransaction) resetTransaction();
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.0"
            step="0.00000001"
            min="0"
            className="custom-input"
          />
        </div>

        <Button
          onClick={handleTransfer}
          disabled={isLoading || isPending || !receiver || parseFloat(amount) <= 0}
          className="w-full"
        >
          {isLoading || isPending ? "Processing..." : "Transfer"}
        </Button>
      </CardContent>
    </Card>
  );
}