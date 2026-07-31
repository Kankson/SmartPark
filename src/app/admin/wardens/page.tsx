import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { getDemoUsersByRole } from "@/server/smartpark-service";

export default function AdminWardensPage() {
  const wardens = getDemoUsersByRole("warden");

  return (
    <Card>
      <h1 className="text-2xl font-bold text-ink">Warden management</h1>
      <p className="mt-2 text-sm text-asphalt/70">Demo accounts are seeded. Production creation is admin-only.</p>
      <div className="mt-5 grid gap-3">
        {wardens.map((warden) => (
          <div key={warden.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4">
            <div>
              <p className="font-semibold text-ink">{warden.fullName}</p>
              <p className="text-sm text-asphalt/70">{warden.email}</p>
            </div>
            <StatusPill status={warden.isActive ? "active" : "unavailable"} />
          </div>
        ))}
      </div>
    </Card>
  );
}
