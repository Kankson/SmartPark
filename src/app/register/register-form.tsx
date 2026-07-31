"use client";

import { useActionState } from "react";

import { registerDriverAction } from "@/app/register/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormError, Input, Label } from "@/components/ui/form";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerDriverAction, { error: "" });

  return (
    <Card className="w-full max-w-lg">
      <h1 className="text-2xl font-bold text-ink">Driver registration</h1>
      <p className="mt-2 text-sm text-asphalt/75">Warden and admin accounts are created only by admins.</p>
      <form action={action} className="mt-6 grid gap-4">
        <Field>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required />
        </Field>
        <Field>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required />
        </Field>
        <Field>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </Field>
        <Field>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </Field>
        {state.error ? <FormError>{state.error}</FormError> : null}
        <Button disabled={pending}>{pending ? "Creating account..." : "Create driver account"}</Button>
      </form>
    </Card>
  );
}
