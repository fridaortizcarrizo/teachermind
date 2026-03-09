import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, className }: StatCardProps) {
  return (
    <GlassCard className={cn("flex items-start gap-4", className)}>
      <div className="rounded-xl bg-primary/15 p-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold font-display text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </GlassCard>
  );
}
