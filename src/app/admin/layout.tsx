import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/zones", label: "Zones" },
  { href: "/admin/spaces", label: "Spaces" },
  { href: "/admin/wardens", label: "Wardens" },
  { href: "/admin/settings", label: "Settings" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin"]);
  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
