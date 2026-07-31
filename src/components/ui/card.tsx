import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-lift
      className={cn(
        "rounded-lg border border-ink/10 bg-white/95 p-5 shadow-panel transition-colors hover:border-ink/20",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-ink", className)} {...props} />;
}
