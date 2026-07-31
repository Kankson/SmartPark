import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md">
        <h1 className="text-2xl font-bold text-ink">Unauthorized</h1>
        <p className="mt-3 text-sm leading-6 text-asphalt/75">
          Your current account does not have access to that SmartPark section.
        </p>
        <Link href="/login" className="mt-5 inline-flex font-semibold text-mint">
          Switch account
        </Link>
      </Card>
    </main>
  );
}
