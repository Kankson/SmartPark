import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omit on the final crumb: the page you are already on is not a link. */
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href ?? item.label} className="flex items-center gap-x-1.5">
              {index > 0 ? <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-asphalt/40" /> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="font-semibold text-mint hover:text-emerald-700">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="font-semibold text-asphalt/70">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
