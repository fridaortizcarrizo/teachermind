import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle";
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "glass",
      strong: "glass-strong",
      subtle: "glass-subtle",
    };
    return (
      <div
        ref={ref}
        className={cn("rounded-2xl p-6", variants[variant], className)}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
