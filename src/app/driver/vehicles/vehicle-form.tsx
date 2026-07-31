"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Label, Select } from "@/components/ui/form";

export function VehicleForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    const response = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not add vehicle.");
      return;
    }
    window.location.reload();
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
    >
      <Field>
        <Label htmlFor="plateNumber">Plate number</Label>
        <Input id="plateNumber" name="plateNumber" placeholder="GR 1234-22" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="make">Make</Label>
          <Input id="make" name="make" required />
        </Field>
        <Field>
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="colour">Colour</Label>
          <Input id="colour" name="colour" required />
        </Field>
        <Field>
          <Label htmlFor="vehicleType">Vehicle type</Label>
          <Select id="vehicleType" name="vehicleType" defaultValue="car">
            <option value="car">Car</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="van">Van</option>
            <option value="accessible">Accessible</option>
          </Select>
        </Field>
      </div>
      {error ? <FormError>{error}</FormError> : null}
      <Button disabled={pending}>
        <Plus size={16} aria-hidden="true" />
        {pending ? "Adding..." : "Add vehicle"}
      </Button>
    </form>
  );
}
