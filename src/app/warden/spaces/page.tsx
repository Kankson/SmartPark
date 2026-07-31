import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getWardenDashboard } from "@/server/smartpark-service";

const spotClass = {
  available: "border-emerald-300 bg-emerald-50 text-emerald-900",
  held: "border-amber-300 bg-amber-50 text-amber-900",
  reserved: "border-blue-300 bg-blue-50 text-blue-900",
  occupied: "border-indigo-300 bg-indigo-50 text-indigo-900",
  unavailable: "border-zinc-300 bg-zinc-100 text-zinc-700"
};

export default function SpacesPage() {
  const dashboard = getWardenDashboard();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">Spaces</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Parking-space grid</h1>
      </div>
      {dashboard.zones.map((zone) => (
        <Card key={zone.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">{zone.name}</h2>
            <StatusPill status={zone.availableSpaces > 0 ? "available" : "unavailable"} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
            {dashboard.spots
              .filter((spot) => spot.zoneId === zone.id)
              .map((spot) => (
                <div
                  key={spot.id}
                  className={cn(
                    "min-h-20 rounded-md border p-3 text-center text-sm font-semibold",
                    spotClass[spot.status],
                  )}
                >
                  <p>{spot.spotCode}</p>
                  <p className="mt-2 text-xs capitalize opacity-75">{spot.status}</p>
                </div>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
