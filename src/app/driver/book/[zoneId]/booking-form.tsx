"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CarFront, Clock3, CreditCard, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormError, Label, Select } from "@/components/ui/form";
import {
  allowedDurations,
  calculateParkingPrice,
  formatMoney,
  type ParkingSpot,
  type Vehicle,
  type ZoneWithAvailability
} from "@/server/domain";

const bookingSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle."),
  spotId: z.string().min(1, "Select a space."),
  durationMinutes: z.coerce.number().int()
});

type BookingInput = z.input<typeof bookingSchema>;
type BookingOutput = z.output<typeof bookingSchema>;

const bookingSteps = [
  { label: "Vehicle", icon: CarFront },
  { label: "Space", icon: MapPinned },
  { label: "Time", icon: Clock3 },
  { label: "Payment", icon: CreditCard }
];

export function BookingForm({
  zone,
  spots,
  vehicles
}: {
  zone: ZoneWithAvailability;
  spots: ParkingSpot[];
  vehicles: Vehicle[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);
  const form = useForm<BookingInput, unknown, BookingOutput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      vehicleId: vehicles[0]?.id ?? "",
      spotId: spots[0]?.id ?? "",
      durationMinutes: 60
    }
  });
  const duration = useWatch({ control: form.control, name: "durationMinutes" });
  const amount = useMemo(
    () => calculateParkingPrice(zone.hourlyRateMinor, Number(duration || 60)),
    [duration, zone.hourlyRateMinor],
  );

  async function submit(values: BookingOutput) {
    setPending(true);
    setServerError("");
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, zoneId: zone.id })
    });
    const data = (await response.json()) as {
      bookingId?: string;
      paymentStatus?: string;
      redirectUrl?: string;
      error?: string;
    };
    setPending(false);

    if (!response.ok || !data.bookingId) {
      setServerError(data.error ?? "Could not create booking.");
      return;
    }

    if (data.paymentStatus === "pending" && data.redirectUrl) {
      window.location.assign(data.redirectUrl);
      return;
    }

    router.push(`/driver/ticket/${data.bookingId}`);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">{zone.name}</h2>
          <p className="mt-1 text-sm text-asphalt/75">{zone.address}</p>
        </div>
        <StatusPill status={zone.availableSpaces > 0 ? "available" : "unavailable"} />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-4" data-motion="stagger">
        {bookingSteps.map(({ label, icon: Icon }, index) => (
          <div key={label} className="rounded-md border border-ink/10 bg-lane p-3">
            <div className="flex items-center justify-between gap-2">
              <Icon className="text-mint" size={18} aria-hidden="true" />
              <span className="text-xs font-bold text-asphalt/55">0{index + 1}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{label}</p>
          </div>
        ))}
      </div>

      <form className="mt-6 grid gap-5" onSubmit={form.handleSubmit(submit)}>
        <Field>
          <Label htmlFor="vehicleId">Vehicle</Label>
          <Select id="vehicleId" {...form.register("vehicleId")}>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </Select>
          {form.formState.errors.vehicleId ? <FormError>{form.formState.errors.vehicleId.message}</FormError> : null}
        </Field>

        <Field>
          <Label htmlFor="spotId">Parking space</Label>
          <Select id="spotId" {...form.register("spotId")}>
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>
                {spot.spotCode}
                {spot.isAccessible ? " - accessible" : ""}
              </option>
            ))}
          </Select>
          {form.formState.errors.spotId ? <FormError>{form.formState.errors.spotId.message}</FormError> : null}
        </Field>

        <Field>
          <Label htmlFor="durationMinutes">Duration</Label>
          <Select id="durationMinutes" {...form.register("durationMinutes")}>
            {allowedDurations.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-lg border border-mint/20 bg-ink p-4 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/60">Server-calculated amount</p>
              <p className="mt-1 text-3xl font-bold">{formatMoney(amount, zone.currency)}</p>
            </div>
            <span className="rounded-md bg-mint/15 px-3 py-2 text-xs font-bold uppercase text-mint" data-motion="pulse">
              Secure checkout
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/60">
            The API recalculates this amount before opening checkout and ignores client-submitted prices.
          </p>
        </div>

        {serverError ? <FormError>{serverError}</FormError> : null}
        <Button disabled={pending || spots.length === 0 || vehicles.length === 0}>
          {pending ? "Creating secure checkout..." : "Continue to payment"}
        </Button>
      </form>
    </Card>
  );
}
