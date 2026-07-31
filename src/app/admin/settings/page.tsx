import { Card } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <Card className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink">System settings</h1>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-asphalt/60">Pricing</dt>
          <dd className="font-semibold text-ink">Fixed hourly rate per zone</dd>
        </div>
        <div>
          <dt className="text-sm text-asphalt/60">Payment provider</dt>
          <dd className="font-semibold text-ink">Mock wallet adapter</dd>
        </div>
        <div>
          <dt className="text-sm text-asphalt/60">Hold window</dt>
          <dd className="font-semibold text-ink">10 minutes</dd>
        </div>
        <div>
          <dt className="text-sm text-asphalt/60">Plate recognition</dt>
          <dd className="font-semibold text-ink">Mock provider, manual confirmation</dd>
        </div>
      </dl>
    </Card>
  );
}
