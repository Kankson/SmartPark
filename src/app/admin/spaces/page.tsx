import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { getWardenDashboard } from "@/server/smartpark-service";

export default function AdminSpacesPage() {
  const dashboard = getWardenDashboard();

  return (
    <Card>
      <h1 className="text-2xl font-bold text-ink">Parking spaces</h1>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-asphalt/60">
            <tr>
              <th className="py-3">Space</th>
              <th>Zone</th>
              <th>Type</th>
              <th>Accessible</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {dashboard.spots.map((spot) => {
              const zone = dashboard.zones.find((item) => item.id === spot.zoneId);
              return (
                <tr key={spot.id}>
                  <td className="py-3 font-semibold text-ink">{spot.spotCode}</td>
                  <td>{zone?.name}</td>
                  <td className="capitalize">{spot.vehicleType}</td>
                  <td>{spot.isAccessible ? "Yes" : "No"}</td>
                  <td>
                    <StatusPill status={spot.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
