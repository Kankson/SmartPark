import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export default async function DriverProfilePage() {
  const user = await requireRole(["driver"]);

  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink">Driver profile</h1>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-asphalt/60">Name</dt>
          <dd className="font-semibold text-ink">{user.fullName}</dd>
        </div>
        <div>
          <dt className="text-sm text-asphalt/60">Email</dt>
          <dd className="font-semibold text-ink">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-asphalt/60">Phone</dt>
          <dd className="font-semibold text-ink">{user.phone}</dd>
        </div>
        <div>
          <dt className="text-sm text-asphalt/60">Role</dt>
          <dd className="font-semibold capitalize text-ink">{user.role}</dd>
        </div>
      </dl>
    </Card>
  );
}
