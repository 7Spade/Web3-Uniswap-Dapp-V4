"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useSignMessage } from "../../hooks/useSignMessage";
import { useToast } from "../../hooks/use-toast";

interface SignMessageProps {
  className?: string;
}

export function SignMessage({ className }: SignMessageProps) {
  const {
    signature,
    recoveredAddress,
    error,
    isPending,
    setRecoveredAddress,
    signMessage,
    resetError,
  } = useSignMessage();
  const { toast } = useToast();
  const [message, setMessage] = useState<string>("");
  const [hasShownError, setHasShownError] = useState<boolean>(false);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setHasShownError(false);
    if (error) {
      resetError();
    }
  };

  const handleSignMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setHasShownError(false);
    signMessage({ message });
  };

  useEffect(() => {
    if (signature && recoveredAddress) {
      toast({
        title: "Message successfully signed!",
        description: `Signature: ${signature}\n\nRecovered Address: ${recoveredAddress}`,
      });
      setRecoveredAddress(undefined);
      setMessage("");
    }

    if (error && !hasShownError) {
      toast({
        title: "An error occurred",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
      setHasShownError(true);
    }
  }, [
    signature,
    recoveredAddress,
    error,
    hasShownError,
    toast,
    setRecoveredAddress,
  ]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Sign Message</CardTitle>
        <CardDescription>
          Sign a message with your connected wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignMessage} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message to sign</Label>
            <Input
              id="message"
              value={message}
              onChange={handleMessageChange}
              placeholder="Enter message to sign"
              disabled={isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || !message.trim()}
            className="w-full"
          >
            {isPending ? "Signing..." : "Sign Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}