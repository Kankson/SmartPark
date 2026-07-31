import Link from "next/link";
import { AlertTriangle, Search } from "lucide-react";

import { ViolationActions } from "@/app/warden/violations/violation-actions";
import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { getViolationPriority } from "@/server/domain";
import { getBookingDetails, getWardenDashboard } from "@/server/smartpark-service";

const priorityStyle = {
  critical: "border-breach/30 bg-breach/10 text-breach",
  high: "border-caution/35 bg-caution/10 text-amber-800",
  watch: "border-signal/25 bg-signal/10 text-signal"
} as const;

export default function ViolationsPage() {
  const dashboard = getWardenDashboard();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">Violations</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Violation alerts</h1>
      </div>
      {dashboard.openViolations.length === 0 ? (
        <Card>
          <p className="text-sm text-asphalt/70">No open violations.</p>
        </Card>
      ) : (
        dashboard.openViolations.map((violation) => {
          const details = getBookingDetails(violation.bookingId);
          const priority = getViolationPriority(violation.overstayMinutes);
          return (
            <Card key={violation.id} className={priority === "critical" ? "border-breach/25" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-1 text-breach" aria-hidden="true" />
                  <div>
                    <h2 className="text-xl font-bold text-ink">{details?.booking.bookingReference}</h2>
                    <p className="mt-1 text-sm text-asphalt/75">
                      {details?.vehicle?.plateNumber} - {details?.zone?.name} - {details?.spot?.spotCode}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase ${priorityStyle[priority]}`}>
                    {priority}
                  </span>
                  <StatusPill status={violation.status} />
                </div>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-asphalt/60">Type</dt>
                  <dd className="font-semibold capitalize text-ink">{violation.violationType.replace("_", " ")}</dd>
                </div>
                <div>
                  <dt className="text-sm text-asphalt/60">Overstay</dt>
                  <dd className="font-semibold text-ink">{violation.overstayMinutes} minutes</dd>
                </div>
                <div>
                  <dt className="text-sm text-asphalt/60">Detected</dt>
                  <dd className="font-semibold text-ink">{new Date(violation.detectedAt).toLocaleString()}</dd>
                </div>
              </dl>
              {details?.vehicle ? (
                <Link
                  href={`/warden/plates?plate=${encodeURIComponent(details.vehicle.plateNumber)}`}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink hover:bg-lane"
                >
                  <Search size={16} aria-hidden="true" /> Verify plate first
                </Link>
              ) : null}
              <ViolationActions violationId={violation.id} />
            </Card>
          );
        })
      )}
    </div>
  );
}
