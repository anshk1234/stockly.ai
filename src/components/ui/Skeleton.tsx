import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-white/[0.05] shimmer-wave animate-pulse",
        className
      )}
      {...props}
    />
  );
}
