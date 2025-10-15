"use server";

import { simulateTransactionImpact } from "@/ai/flows/simulate-transaction-impact";
import type { SimulateTransactionImpactInput, SimulateTransactionImpactOutput } from "@/ai/flows/simulate-transaction-impact";

export interface SimulationState {
  result: SimulateTransactionImpactOutput | null;
  error: string | null;
  input: SimulateTransactionImpactInput | null;
}

export async function runSimulation(
  _prevState: SimulationState | null,
  formData: FormData
): Promise<SimulationState> {
  const tokenIn = formData.get("tokenIn") as string;
  const tokenOut = formData.get("tokenOut") as string;
  const amountIn = parseFloat(formData.get("amountIn") as string);
  const currentPrice = parseFloat(formData.get("currentPrice") as string);

  const input: SimulateTransactionImpactInput = {
    tokenIn,
    tokenOut,
    amountIn,
    currentPrice: isNaN(currentPrice) ? undefined : currentPrice,
  };

  if (!tokenIn || !tokenOut || isNaN(amountIn) || amountIn <= 0) {
    return { result: null, error: "Invalid input. Please provide valid token and amount details.", input: null };
  }

  try {
    const result = await simulateTransactionImpact(input);
    return { result, error: null, input };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { result: null, error: `Simulation failed: ${errorMessage}`, input };
  }
}
