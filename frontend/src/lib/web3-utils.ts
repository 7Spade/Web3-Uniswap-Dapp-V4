/**
 * Web3 utility functions for address formatting and validation
 */

export const getEllipsisTxt = (str: `0x${string}`, n: number = 6): string => {
  if (str) {
    return `${str.slice(0, n)}...${str.slice(str.length - n)}`;
  }
  return "";
};

export const isValidEthAddress = (address: string): boolean => {
  return address.startsWith("0x") && address.length === 42;
};

export const formatBalance = (balance: string | undefined, decimals: number = 4): string => {
  if (!balance) return "0";
  const num = parseFloat(balance);
  return num.toFixed(decimals);
};

export const formatAddress = (address: string | undefined, length: number = 6): string => {
  if (!address) return "";
  if (address.length <= length * 2 + 2) return address;
  return getEllipsisTxt(address as `0x${string}`, length);
};