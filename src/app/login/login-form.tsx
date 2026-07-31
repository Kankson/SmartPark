"use client";

import { useActionState } from "react";
import { Car, ShieldCheck, Settings } from "lucide-react";

import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormError, Input, Label } from "@/components/ui/form";

const demoAccounts = [
  { label: "Driver", email: "driver@smartpark.test", icon: Car },
  { label: "Warden", email: "warden@smartpark.test", icon: ShieldCheck },
  { label: "Admin", email: "admin@smartpark.test", icon: Settings }
];

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-ink">Log in</h1>
      <p className="mt-2 text-sm text-asphalt/75">Use a demo account or enter matching credentials.</p>
      <form action={formAction} className="mt-6 space-y-4">
        <Field>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue="driver@smartpark.test" required />
        </Field>
        <Field>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" defaultValue="password123" required />
        </Field>
        {state.error ? <FormError>{state.error}</FormError> : null}
        <Button className="w-full" disabled={pending}>
          {pending ? "Checking..." : "Log in"}
        </Button>
      </form>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {demoAccounts.map((account) => (
          <form key={account.email} action={formAction}>
            <input type="hidden" name="email" value={account.email} />
            <input type="hidden" name="password" value="password123" />
            <button
              className="flex w-full flex-col items-center gap-2 rounded-md border border-ink/10 bg-lane px-2 py-3 text-xs font-semibold text-ink hover:bg-kerb"
              type="submit"
            >
              <account.icon size={18} aria-hidden="true" />
              {account.label}
            </button>
          </form>
        ))}
      </div>
    </Card>
  );
}
