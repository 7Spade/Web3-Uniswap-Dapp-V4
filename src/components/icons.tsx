import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))" }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))" }} />
        </linearGradient>
      </defs>
      <path d="M50 0 L90 25 V75 L50 100 L10 75 V25 Z" fill="url(#grad1)" />
      <path d="M50 10 L80 30 V70 L50 90 L20 70 V30 Z" fill="hsl(var(--background))" />
      <path d="M50 20 L70 35 V65 L50 80 L30 65 V35 Z" fill="url(#grad1)" />
    </svg>
  );
}


export function EthIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" >
            <path d="M12.25 2.016L6.03 12.43l6.22 2.723l6.22-2.723L12.25 2.015zm0 14.507l-6.22-2.723l6.22 7.468l6.22-7.468l-6.22 2.723z"/>
        </svg>
    )
}

export function UsdcIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          $
        </text>
      </svg>
    )
}
