import { AlertTriangle, CircleDollarSign, ParkingCircle, UsersRound } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { Card } from "@/components/ui/card";
import { getDemoUsersByRole, getWardenDashboard } from "@/server/smartpark-service";

export default function AdminDashboardPage() {
  const dashboard = getWardenDashboard();
  const wardens = getDemoUsersByRole("warden");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">System setup</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Parking zones" value={dashboard.zones.length} icon={ParkingCircle} />
        <MetricCard label="Wardens" value={wardens.length} icon={UsersRound} />
        <MetricCard label="Open violations" value={dashboard.summary.openViolations} icon={AlertTriangle} tone="text-breach" />
        <MetricCard label="Pricing mode" value="Fixed" icon={CircleDollarSign} tone="text-signal" />
      </div>
      <Card>
        <h2 className="text-xl font-bold text-ink">Admin scope</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-asphalt/75">
          The MVP keeps admin deliberately simple: zone/space inspection, warden account overview, and documented
          settings. Real create/update controls should be backed by Supabase RLS and audit logging before production.
        </p>
      </Card>
    </div>
  );
}
