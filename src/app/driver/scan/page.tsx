import { ZoneScanner } from "@/app/driver/scan/zone-scanner";
import { listZones } from "@/server/smartpark-service";

export default function ScanZonePage() {
  const zones = listZones().map(({ id, code, name, address }) => ({ id, code, name, address }));
  return <ZoneScanner zones={zones} />;
}
