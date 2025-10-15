"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddressInput } from "@/hooks/useWeb3";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function AddressInput({ 
  value, 
  onChange, 
  className, 
  placeholder = "Enter address or ENS name" 
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const {
    resolvedEthAddress,
    isResolvingInProgress,
    isValidInput,
    hasError,
    errorMessage,
    isTyping,
  } = useAddressInput(inputValue);

  useEffect(() => {
    onChange(inputValue);
  }, [inputValue, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const displayValue = resolvedEthAddress || inputValue;
  const showError = hasError && !isTyping && inputValue.trim() !== "";
  const showLoading = isResolvingInProgress && !isTyping;

  return (
    <div className={className}>
      <Label htmlFor="address-input">Recipient Address</Label>
      <div className="relative">
        <Input
          id="address-input"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pr-10 ${showError ? "border-red-500" : ""}`}
        />
        {showLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        )}
        {isValidInput && !isTyping && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>
      {showError && (
        <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
      )}
      {isValidInput && resolvedEthAddress && !isTyping && (
        <p className="text-sm text-green-600 mt-1">
          ✓ Resolved: {resolvedEthAddress}
        </p>
      )}
    </div>
  );
}