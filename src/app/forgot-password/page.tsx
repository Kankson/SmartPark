import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md">
        <h1 className="text-2xl font-bold text-ink">Password reset</h1>
        <p className="mt-3 text-sm leading-6 text-asphalt/75">
          The MVP is wired for email/password authentication. Supabase password reset email delivery is configured
          during real project setup.
        </p>
        <Link href="/login" className="mt-5 inline-flex font-semibold text-mint">
          Back to login
        </Link>
      </Card>
    </main>
  );
}
