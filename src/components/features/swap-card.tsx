"use client";

import { useState, useMemo, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowDownUp, ChevronDown, Loader2, Zap } from "lucide-react";

import { tokens, type Token } from "@/lib/tokens";
import { runSimulation } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TokenSelector } from "@/components/features/token-selector";
import { SimulationResultDialog } from "@/components/features/simulation-result-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const MOCK_PRICES: Record<string, number> = {
  "ETH-USDC": 3000, "USDC-ETH": 1 / 3000,
  "ETH-DAI": 2995, "DAI-ETH": 1 / 2995,
  "ETH-WBTC": 0.05, "WBTC-ETH": 20,
  "USDC-DAI": 1.001, "DAI-USDC": 1 / 1.001,
  "UNI-USDC": 7.5, "USDC-UNI": 1/7.5,
  "WBTC-USDC": 60000, "USDC-WBTC": 1/60000,
};

const getPrice = (tokenInSymbol: string, tokenOutSymbol: string) => {
    if (tokenInSymbol === tokenOutSymbol) return 1;
    return MOCK_PRICES[`${tokenInSymbol}-${tokenOutSymbol}`] ?? MOCK_PRICES[`${tokenOutSymbol}-${tokenInSymbol}`] ? 1 / MOCK_PRICES[`${tokenOutSymbol}-${tokenInSymbol}`] : 0;
}

const initialSimulationState = { result: null, error: null, input: null };

function SimulateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
      {pending ? 'Simulating...' : 'AI Simulate'}
    </Button>
  )
}

export default function SwapCard() {
  const [tokenIn, setTokenIn] = useState<Token>(tokens[0]);
  const [tokenOut, setTokenOut] = useState<Token>(tokens[1]);
  const [amountIn, setAmountIn] = useState("1.0");
  const [amountOut, setAmountOut] = useState("");
  const [isSelectingFor, setIsSelectingFor] = useState<'in' | 'out' | null>(null);
  
  const [simulationState, formAction] = useActionState(runSimulation, initialSimulationState);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  
  const { toast } = useToast();
  
  const price = useMemo(() => getPrice(tokenIn.symbol, tokenOut.symbol), [tokenIn, tokenOut]);

  useEffect(() => {
    if (price > 0 && amountIn) {
      const numericAmountIn = parseFloat(amountIn);
      if (!isNaN(numericAmountIn)) {
        setAmountOut((numericAmountIn * price).toFixed(6));
      }
    } else {
      setAmountOut("");
    }
  }, [amountIn, price]);
  
  useEffect(() => {
    if (simulationState.result || simulationState.error) {
      setIsSimulationOpen(true);
    }
  }, [simulationState]);
  
  const handleSwapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };
  
  const handleSelectToken = (token: Token) => {
    if (isSelectingFor === 'in') {
      if (token.address === tokenOut.address) {
        handleSwapTokens();
      } else {
        setTokenIn(token);
      }
    } else if (isSelectingFor === 'out') {
      if (token.address === tokenIn.address) {
        handleSwapTokens();
      } else {
        setTokenOut(token);
      }
    }
    setIsSelectingFor(null);
  };
  
  const handleSwap = () => {
    toast({
      title: "Transaction Submitted",
      description: `Swapping ${amountIn} ${tokenIn.symbol} for ${amountOut} ${tokenOut.symbol}`,
    });
  };
  
  const TokenInIcon = tokenIn.icon;
  const TokenOutIcon = tokenOut.icon;

  return (
    <>
      <Card className="w-full max-w-md shadow-2xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-xl">Swap</CardTitle>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <input type="hidden" name="tokenIn" value={tokenIn.symbol} />
            <input type="hidden" name="tokenOut" value={tokenOut.symbol} />
            <input type="hidden" name="amountIn" value={amountIn} />
            <input type="hidden" name="currentPrice" value={price} />

            <div className="relative space-y-2">
              <div className="grid gap-2 rounded-lg border bg-secondary/50 p-4">
                <label className="text-sm text-muted-foreground">You pay</label>
                <div className="flex items-center justify-between gap-2">
                  <Input type="number" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} placeholder="0.0" className="w-full border-none bg-transparent p-0 text-2xl focus-visible:ring-0" />
                  <Button variant="outline" onClick={() => setIsSelectingFor('in')} className="flex items-center gap-2 text-lg shrink-0">
                    <TokenInIcon className="h-6 w-6" /> {tokenIn.symbol} <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Button variant="secondary" size="icon" className="z-10 h-8 w-8 rounded-full border" onClick={handleSwapTokens}>
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-2 rounded-lg border bg-secondary/50 p-4">
                <label className="text-sm text-muted-foreground">You receive</label>
                <div className="flex items-center justify-between gap-2">
                  <Input type="number" value={amountOut} readOnly placeholder="0.0" className="w-full border-none bg-transparent p-0 text-2xl focus-visible:ring-0" />
                  <Button variant="outline" onClick={() => setIsSelectingFor('out')} className="flex items-center gap-2 text-lg shrink-0">
                    <TokenOutIcon className="h-6 w-6" /> {tokenOut.symbol} <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground">1 {tokenIn.symbol} ≈ {price.toFixed(5)} {tokenOut.symbol}</p>
              <p className="text-sm text-muted-foreground">Estimated Gas: ~$5.32</p>
            </div>
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-2">
              <SimulateButton />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" disabled={!parseFloat(amountIn) || !parseFloat(amountOut)}>Swap</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Swap</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are about to swap {amountIn} {tokenIn.symbol} for approximately {amountOut} {tokenOut.symbol}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Separator />
                    <div className="space-y-2 py-2 text-sm">
                      <div className="flex justify-between"><span>Price:</span><span>1 {tokenIn.symbol} ≈ {price.toFixed(5)} {tokenOut.symbol}</span></div>
                      <div className="flex justify-between"><span>Slippage Tolerance:</span><span>0.5%</span></div>
                      <div className="flex justify-between"><span>Estimated Gas:</span><span>~$5.32</span></div>
                    </div>
                  <Separator />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSwap}>Confirm Swap</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </CardFooter>
        </form>
      </Card>
      
      <TokenSelector
        open={isSelectingFor !== null}
        onOpenChange={(isOpen) => !isOpen && setIsSelectingFor(null)}
        onSelectToken={handleSelectToken}
        selectedToken={isSelectingFor === 'in' ? tokenIn : tokenOut}
      />
      
      <SimulationResultDialog
        state={simulationState}
        open={isSimulationOpen}
        onOpenChange={setIsSimulationOpen}
      />
    </>
  );
}
