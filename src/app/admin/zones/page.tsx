import { ZoneSign } from "@/app/admin/zones/zone-sign";
import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/server/domain";
import { getZoneQrPayload, listZones } from "@/server/smartpark-service";

export default function AdminZonesPage() {
  const zones = listZones();

  return (
    <Card>
      <h1 className="text-2xl font-bold text-ink">Parking zones</h1>
      <div className="mt-5 grid gap-3">
        {zones.map((zone) => (
          <div key={zone.id} className="rounded-lg border border-ink/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-ink">{zone.name}</p>
                <p className="text-sm text-asphalt/70">{zone.address}</p>
              </div>
              <StatusPill status={zone.isActive ? "available" : "unavailable"} />
            </div>
            <p className="mt-3 text-sm text-asphalt/70">
              {formatMoney(zone.hourlyRateMinor, zone.currency)}/hr - {zone.totalSpaces} spaces
            </p>
            <ZoneSign payload={getZoneQrPayload(zone.id)} code={zone.code} name={zone.name} />
          </div>
        ))}
      </div>
    </Card>
  );
}
