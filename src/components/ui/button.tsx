import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const variants = {
  primary: "bg-mint text-white hover:bg-emerald-700 focus-visible:ring-mint",
  secondary: "bg-white text-ink border border-ink/15 hover:bg-kerb focus-visible:ring-signal",
  danger: "bg-breach text-white hover:bg-red-700 focus-visible:ring-breach",
  ghost: "bg-transparent text-ink hover:bg-ink/5 focus-visible:ring-signal"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
