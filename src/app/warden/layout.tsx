import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

const nav = [
  { href: "/warden", label: "Dashboard" },
  { href: "/warden/spaces", label: "Spaces" },
  { href: "/warden/scanner", label: "Scanner" },
  { href: "/warden/plates", label: "Plates" },
  { href: "/warden/violations", label: "Violations" },
  { href: "/warden/profile", label: "Profile" }
];

export default async function WardenLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["warden"]);
  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
