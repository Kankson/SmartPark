import { type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "text-mint"
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <Card className="p-4" data-motion="metric">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-asphalt/70">{label}</p>
          <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
        </div>
        <Icon className={tone} aria-hidden="true" size={26} />
      </div>
    </Card>
  );
}
