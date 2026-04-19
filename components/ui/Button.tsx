import { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  // Vercel design: 3 weights only (400/500/600), radius 6px, no heavy shadows
  const base =
    "inline-flex items-center justify-center font-medium rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[hsla(212,100%,48%,1)] disabled:opacity-50 disabled:pointer-events-none select-none";

  const variants = {
    // Dark primary — Vercel Black
    primary:
      "bg-[#171717] text-white hover:bg-[#2a2a2a] active:bg-[#111111]",
    // Shadow-bordered secondary — white with ring-border
    secondary:
      "bg-white text-[#171717] shadow-border hover:bg-[#fafafa] active:bg-[#f5f5f5]",
    // Outline matches secondary
    outline:
      "bg-white text-[#171717] shadow-border hover:bg-[#fafafa]",
    // Danger
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    // Ghost — no border, no bg
    ghost:
      "bg-transparent text-[#4d4d4d] hover:bg-[#fafafa] hover:text-[#171717]",
  };

  const sizes = {
    sm: "h-7 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-11 px-6 text-base gap-2.5",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
