import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { listDriverVehicles } from "@/server/smartpark-service";
import { VehicleForm } from "@/app/driver/vehicles/vehicle-form";

export default async function VehiclesPage() {
  const user = await requireRole(["driver"]);
  const vehicles = listDriverVehicles(user.id);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <h1 className="text-2xl font-bold text-ink">Vehicles</h1>
        <div className="mt-5 grid gap-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="rounded-lg border border-ink/10 bg-lane p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{vehicle.plateNumber}</p>
                  <p className="text-sm text-asphalt/70">
                    {vehicle.colour} {vehicle.make} {vehicle.model}
                  </p>
                </div>
                <StatusPill status={vehicle.isActive ? "active" : "unavailable"} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-bold text-ink">Add vehicle</h2>
        <div className="mt-5">
          <VehicleForm />
        </div>
      </Card>
    </div>
  );
}
