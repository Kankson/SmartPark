import { CheckCircle2, CircleAlert, Database, KeyRound, Webhook } from "lucide-react";

import { AzaConnectionCheck } from "@/components/aza-connection-check";
import { Card, CardTitle } from "@/components/ui/card";
import { getAzaConfigurationStatus } from "@/server/payment-provider";

export default function AdminSettingsPage() {
  const aza = getAzaConfigurationStatus();
  const usesAza = aza.provider === "aza";

  return (
    <div className="max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-ink">System settings</h1>
        <p className="mt-1 text-sm text-asphalt/70">Operational status without exposing server secrets.</p>
      </header>

      <Card>
        <CardTitle>Parking configuration</CardTitle>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-asphalt/60">Pricing</dt>
            <dd className="font-semibold text-ink">Fixed hourly rate per zone</dd>
          </div>
          <div>
            <dt className="text-sm text-asphalt/60">Payment provider</dt>
            <dd className="font-semibold text-ink">{usesAza ? "AZA hosted checkout" : "Mock wallet adapter"}</dd>
          </div>
          <div>
            <dt className="text-sm text-asphalt/60">Hold window</dt>
            <dd className="font-semibold text-ink">{usesAza ? "Until checkout expires" : "10 minutes"}</dd>
          </div>
          <div>
            <dt className="text-sm text-asphalt/60">Plate recognition</dt>
            <dd className="font-semibold text-ink">Mock provider, manual confirmation</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>AZA payment readiness</CardTitle>
            <p className="mt-1 text-sm text-asphalt/65">Values are read only on the server and are never displayed.</p>
          </div>
          <div className={`flex items-center gap-2 text-sm font-semibold ${aza.ready ? "text-emerald-700" : "text-amber-700"}`}>
            {aza.ready ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
            {aza.ready ? "Ready to test" : "Setup required"}
          </div>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <KeyRound className="mt-0.5 size-5 shrink-0 text-asphalt/55" />
            <div>
              <dt className="text-sm text-asphalt/60">API key</dt>
              <dd className="font-semibold text-ink">
                {aza.apiKeyConfigured ? `Configured (${aza.apiKeyMode})` : "Missing or placeholder"}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Webhook className="mt-0.5 size-5 shrink-0 text-asphalt/55" />
            <div>
              <dt className="text-sm text-asphalt/60">Signing secret</dt>
              <dd className="font-semibold text-ink">
                {aza.webhookSecretConfigured ? "Configured" : "Missing or placeholder"}
              </dd>
            </div>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-asphalt/60">Webhook endpoint</dt>
            <dd className="mt-1 break-all font-mono text-sm font-semibold text-ink">{aza.webhookUrl}</dd>
          </div>
        </dl>

        <AzaConnectionCheck webhookUrl={aza.webhookUrl} canTest={aza.ready} />
      </Card>

      <div className="flex gap-3 border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950">
        <Database className="mt-0.5 size-5 shrink-0" />
        <p>
          This build still uses demo in-memory storage. Use a durable database before accepting real payments across
          multiple server instances; otherwise a webhook may not find the booking that created it.
        </p>
      </div>
    </div>
  );
}
