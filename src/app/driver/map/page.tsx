import { ZoneMap } from "@/app/driver/map/zone-map";
import { listZones } from "@/server/smartpark-service";

export default function DriverMapPage() {
  const zones = listZones();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">Parking map</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Choose a parking zone</h1>
      </div>
      <ZoneMap zones={zones} />
    </div>
  );
}
