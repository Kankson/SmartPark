import { cn } from "@/lib/utils";

const tones = {
  available: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  held: "bg-amber-50 text-amber-800 ring-amber-600/20",
  reserved: "bg-blue-50 text-blue-800 ring-blue-600/20",
  active: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
  occupied: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
  expired: "bg-red-50 text-red-800 ring-red-600/20",
  completed: "bg-slate-100 text-slate-700 ring-slate-500/20",
  unavailable: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
  open: "bg-red-50 text-red-800 ring-red-600/20",
  confirmed: "bg-amber-50 text-amber-800 ring-amber-600/20",
  dismissed: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
  successful: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  failed: "bg-red-50 text-red-800 ring-red-600/20",
  valid: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  invalid: "bg-red-50 text-red-800 ring-red-600/20",
  mismatch: "bg-red-50 text-red-800 ring-red-600/20",
  not_found: "bg-red-50 text-red-800 ring-red-600/20",
  already_used: "bg-amber-50 text-amber-800 ring-amber-600/20"
} as const;

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const tone = tones[status as keyof typeof tones] ?? "bg-slate-100 text-slate-700 ring-slate-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1",
        tone,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
