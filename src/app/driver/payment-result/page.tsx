import Link from "next/link";

import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export default async function PaymentResultPage() {
  await requireRole(["driver"]);

  return (
    <Card className="max-w-xl">
      <h1 className="text-2xl font-bold text-ink">Payment processed</h1>
      <p className="mt-3 text-sm leading-6 text-asphalt/75">
        SmartPark confirms payments on the server before reserving a space and issuing a QR ticket.
      </p>
      <Link href="/driver/history" className="mt-5 inline-flex font-semibold text-mint">
        View booking history
      </Link>
    </Card>
  );
}
