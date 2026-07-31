"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";

export function ViolationActions({ violationId }: { violationId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<"confirm" | "dismiss" | null>(null);
  const [error, setError] = useState("");

  async function update(action: "confirm" | "dismiss") {
    setError("");
    if (action === "dismiss" && notes.trim().length < 3) {
      setError("Add a short reason before dismissing an alert.");
      return;
    }

    setPending(action);
    try {
      const response = await fetch(`/api/violations/${violationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, notes: notes.trim() })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Violation could not be updated.");
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Violation could not be updated.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Warden notes" />
        <Button type="button" disabled={pending !== null} onClick={() => void update("confirm")}>
          <Check size={16} aria-hidden="true" /> {pending === "confirm" ? "Confirming..." : "Confirm"}
        </Button>
        <Button type="button" variant="secondary" disabled={pending !== null} onClick={() => void update("dismiss")}>
          <X size={16} aria-hidden="true" /> {pending === "dismiss" ? "Dismissing..." : "Dismiss"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-breach" role="alert">{error}</p> : null}
    </div>
  );
}
