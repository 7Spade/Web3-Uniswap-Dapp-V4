import type { ElementType, SVGProps } from "react";
import { AppLogo, EthIcon, UsdcIcon } from "@/components/icons";
import { DollarSign, Bitcoin } from "lucide-react";

export interface Token {
  symbol: string;
  name: string;
  icon: ElementType<SVGProps<SVGSVGElement>>;
  address: string;
  decimals: number;
}

export const tokens: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: EthIcon,
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: UsdcIcon,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    icon: DollarSign,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    icon: AppLogo,
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    icon: Bitcoin,
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
  },
];
