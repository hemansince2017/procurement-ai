import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "mono";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  // Vercel design: pill badges — 9999px radius, 10px h-padding, 12px Geist weight 500
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-none";

  const variants = {
    default: "bg-[#f5f5f5] text-[#4d4d4d]",
    success: "bg-[#f0fdf4] text-[#16a34a]",
    warning: "bg-[#fffbeb] text-[#b45309]",
    danger:  "bg-[#fef2f2] text-[#dc2626]",
    info:    "bg-[#ebf5ff] text-[#0068d6]",
    mono:    "bg-[#f5f5f5] text-[#4d4d4d] font-mono tracking-tight",
  };

  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  );
}
