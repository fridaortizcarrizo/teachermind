import * as React from "react";
import { cn } from "@/lib/utils";
import type { CEFRLevel } from "@/types";

const levelColors: Record<CEFRLevel, string> = {
  A1: "bg-emerald-500/20 text-emerald-800 border-emerald-500/30",
  A2: "bg-amber-500/20 text-amber-800 border-amber-500/30",
  B1: "bg-sky-500/20 text-sky-800 border-sky-500/30",
  B2: "bg-violet-500/20 text-violet-800 border-violet-500/30",
  C1: "bg-rose-500/20 text-rose-800 border-rose-500/30",
  C2: "bg-fuchsia-500/20 text-fuchsia-800 border-fuchsia-500/30",
};

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level?: CEFRLevel;
  variant?: "level" | "default";
}

const GlassBadge = React.forwardRef<HTMLSpanElement, GlassBadgeProps>(
  ({ className, level, variant = "default", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border backdrop-blur-sm";
    const colorStyles = variant === "level" && level ? levelColors[level] : "bg-primary/15 text-primary border-primary/25";

    return (
      <span ref={ref} className={cn(baseStyles, colorStyles, className)} {...props}>
        {variant === "level" && level ? level : children}
      </span>
    );
  }
);
GlassBadge.displayName = "GlassBadge";

export { GlassBadge };
