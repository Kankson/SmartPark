import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Breadcrumbs
          className="mb-5"
          items={[
            { label: "SmartPark", href: "/" },
            { label: "Log in", href: "/login" },
            { label: "Forgot password" }
          ]}
        />
        <Card>
          <h1 className="text-2xl font-bold text-ink">Password reset</h1>
          <p className="mt-3 text-sm leading-6 text-asphalt/75">
            The MVP is wired for email/password authentication. Supabase password reset email delivery is configured
            during real project setup.
          </p>
          <Link href="/login" className="mt-5 inline-flex font-semibold text-mint">
            Back to login
          </Link>
        </Card>
      </div>
    </main>
  );
}
