"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form";
import { calculateParkingPrice, formatMoney } from "@/server/domain";

const extensionOptions = [30, 60, 90];

export function ExtendSessionPanel({
  bookingId,
  hourlyRateMinor,
  currency
}: {
  bookingId: string;
  hourlyRateMinor: number;
  currency: string;
}) {
  const router = useRouter();
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const amount = useMemo(
    () => calculateParkingPrice(hourlyRateMinor, selectedMinutes),
    [hourlyRateMinor, selectedMinutes],
  );

  async function extendSession() {
    setError("");
    setMessage("");
    setSubmitting(true);
    let response: Response;
    try {
      response = await fetch(`/api/bookings/${bookingId}/extend`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ extensionMinutes: selectedMinutes })
      });
    } catch {
      setSubmitting(false);
      setError("Network error. Try again.");
      return;
    }
    setSubmitting(false);
    const data = (await response.json()) as { error?: string; pending?: boolean; redirectUrl?: string };

    if (!response.ok) {
      setError(data.error ?? "Could not extend this session.");
      return;
    }

    if (data.pending && data.redirectUrl) {
      window.location.assign(data.redirectUrl);
      return;
    }

    setMessage(`Extended by ${selectedMinutes} minutes.`);
    startTransition(() => router.refresh());
  }

  return (
    <div className="mt-6 rounded-lg border border-mint/20 bg-lane p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-mint">
            <Clock3 size={16} aria-hidden="true" />
            Extend session
          </p>
          <p className="mt-1 text-sm text-asphalt/70">
            Pay securely to add time before the warden queue flags the vehicle.
          </p>
        </div>
        <p className="rounded-md bg-white px-3 py-2 text-sm font-bold text-ink shadow-sm">
          {formatMoney(amount, currency)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {extensionOptions.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
              selectedMinutes === minutes
                ? "border-mint bg-mint text-white"
                : "border-ink/15 bg-white text-ink hover:bg-kerb"
            }`}
            onClick={() => setSelectedMinutes(minutes)}
          >
            +{minutes} min
          </button>
        ))}
      </div>

      {error ? <FormError className="mt-3">{error}</FormError> : null}
      {message ? <p className="mt-3 text-sm font-semibold text-mint">{message}</p> : null}

      <Button className="mt-4" disabled={submitting || pending} onClick={() => void extendSession()}>
        <Plus size={16} aria-hidden="true" />
        {submitting || pending ? "Creating checkout..." : "Pay and extend"}
      </Button>
    </div>
  );
}
