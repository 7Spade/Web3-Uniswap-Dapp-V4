import { useCallback, useEffect, useState } from "react";
import { recoverMessageAddress, type Address } from "viem";
import { useSignMessage as useWagmiSignMessage, type UseSignMessageReturnType } from "wagmi";

interface UseSignMessageResult {
  signature: string | undefined;
  recoveredAddress: Address | undefined;
  error: Error | null;
  isPending: boolean;
  signMessage: UseSignMessageReturnType["signMessage"];
  resetError: () => void;
  setRecoveredAddress: (address: Address | undefined) => void;
}

export function useSignMessage(): UseSignMessageResult {
  const [recoveredAddress, setRecoveredAddress] = useState<Address>();
  const { data: signature, variables, error, isPending, signMessage, reset } = useWagmiSignMessage();

  const recoverAddress = useCallback(async () => {
    if (!variables?.message || !signature) return;

    try {
      const recovered = await recoverMessageAddress({
        message: variables.message,
        signature,
      });
      setRecoveredAddress(recovered);
    } catch (err) {
      console.error("Error recovering address:", err);
    }
  }, [signature, variables?.message]);

  useEffect(() => {
    if (signature && variables?.message) {
      recoverAddress();
    }
  }, [signature, variables?.message, recoverAddress]);

  const resetError = useCallback(() => {
    reset();
  }, [reset]);

  return {
    signature,
    recoveredAddress,
    error,
    isPending,
    setRecoveredAddress,
    signMessage,
    resetError,
  };
}