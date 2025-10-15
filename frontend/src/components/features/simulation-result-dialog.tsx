"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { type SimulationState } from "../../lib/actions";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { TrendingDown, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface SimulationResultDialogProps {
  state: SimulationState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimulationResultDialog({ state, open, onOpenChange }: SimulationResultDialogProps) {
  const { result, error, input } = state;
  const isNegativeImpact = result && result.simulatedPriceImpact < 0;
  const isSignificantImpact = result && Math.abs(result.simulatedPriceImpact) > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Simulation Result</DialogTitle>
          {input && (
            <DialogDescription>
              Simulating a swap of {input.amountIn} {input.tokenIn} for {input.tokenOut}.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Simulation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-secondary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Price Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                       <p className="text-2xl font-bold">
                         {result.simulatedPriceImpact.toFixed(4)}%
                       </p>
                       {isNegativeImpact ? <TrendingDown className="h-5 w-5 text-destructive" /> : <TrendingUp className="h-5 w-5 text-chart-2" />}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/50">
                   <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Est. New Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${result.estimatedNewPrice.toFixed(4)}</p>
                  </CardContent>
                </Card>
              </div>
              <Alert variant={isSignificantImpact ? "destructive" : "default"} className="bg-card border-border">
                 {isSignificantImpact ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" /> }
                 <AlertTitle>AI Analysis</AlertTitle>
                 <AlertDescription>{result.analysis}</AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
