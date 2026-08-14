"use client";

import { useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AutoRefresh({ intervalMs = 15_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, refresh]);

  return (
    <button
      type="button"
      onClick={refresh}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-ink/10 bg-white px-3 text-xs font-semibold text-asphalt shadow-sm transition hover:border-mint/30 hover:text-ink"
      aria-label="Refresh live parking data"
      title="Refresh live parking data"
      disabled={isPending}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-50" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint" />
      </span>
      <span>{isPending ? "Refreshing" : "Auto-refresh"}</span>
      <RefreshCw className={isPending ? "animate-spin" : ""} size={14} aria-hidden="true" />
    </button>
  );
}
