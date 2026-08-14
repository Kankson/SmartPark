import { ZoneMap } from "@/app/driver/map/zone-map";
import { AutoRefresh } from "@/components/auto-refresh";
import { listZones } from "@/server/smartpark-service";

export default function DriverMapPage() {
  const zones = listZones();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-mint">Parking map</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Choose a parking zone</h1>
        </div>
        <AutoRefresh />
      </div>
      <ZoneMap zones={zones} />
    </div>
  );
}
