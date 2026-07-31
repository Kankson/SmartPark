import Link from "next/link";

import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export default async function DriverPaymentPage() {
  await requireRole(["driver"]);

  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink">Payment</h1>
      <p className="mt-3 text-sm leading-6 text-asphalt/75">
        SmartPark creates a server-verified checkout for each reservation. The QR ticket is issued only after the
        payment provider confirms the transaction.
      </p>
      <Link href="/driver/map" className="mt-5 inline-flex font-semibold text-mint">
        Choose parking
      </Link>
    </Card>
  );
}
