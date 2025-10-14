'use server';

/**
 * @fileOverview Simulates the impact of a swap transaction on the price of tokens.
 *
 * - simulateTransactionImpact - Simulates the impact of a swap transaction on token prices.
 * - SimulateTransactionImpactInput - The input type for the simulateTransactionImpact function.
 * - SimulateTransactionImpactOutput - The return type for the simulateTransactionImpact function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateTransactionImpactInputSchema = z.object({
  tokenIn: z.string().describe('The symbol or address of the input token.'),
  tokenOut: z.string().describe('The symbol or address of the output token.'),
  amountIn: z.number().describe('The amount of the input token to swap.'),
  currentPrice: z.number().optional().describe('The current price of the token pair (optional).'),
});

export type SimulateTransactionImpactInput = z.infer<typeof SimulateTransactionImpactInputSchema>;

const SimulateTransactionImpactOutputSchema = z.object({
  simulatedPriceImpact: z
    .number()
    .describe(
      'The estimated percentage impact on the price of the token pair after the swap transaction.'
    ),
  estimatedNewPrice: z
    .number()
    .describe('The estimated new price of the token pair after the swap transaction.'),
  analysis: z
    .string()
    .describe(
      'A qualitative analysis of the price impact, including whether it is significant or not.'
    ),
});

export type SimulateTransactionImpactOutput = z.infer<typeof SimulateTransactionImpactOutputSchema>;

export async function simulateTransactionImpact(
  input: SimulateTransactionImpactInput
): Promise<SimulateTransactionImpactOutput> {
  return simulateTransactionImpactFlow(input);
}

const simulateTransactionImpactPrompt = ai.definePrompt({
  name: 'simulateTransactionImpactPrompt',
  input: {schema: SimulateTransactionImpactInputSchema},
  output: {schema: SimulateTransactionImpactOutputSchema},
  prompt: `You are a DeFi expert that can predict the impact of a swap transaction on the price of tokens.

  Consider the following swap transaction:
  - Token In: {{{tokenIn}}}
  - Token Out: {{{tokenOut}}}
  - Amount In: {{{amountIn}}}
  {{#if currentPrice}}
  - Current Price: {{{currentPrice}}}
  {{/if}}

  Simulate the price impact of this transaction and estimate the new price after the swap. Also, provide a qualitative analysis of the price impact.
  Be as precise as possible in the determination of price impact.
  `,
});

const simulateTransactionImpactFlow = ai.defineFlow(
  {
    name: 'simulateTransactionImpactFlow',
    inputSchema: SimulateTransactionImpactInputSchema,
    outputSchema: SimulateTransactionImpactOutputSchema,
  },
  async input => {
    const {output} = await simulateTransactionImpactPrompt(input);
    return output!;
  }
);
