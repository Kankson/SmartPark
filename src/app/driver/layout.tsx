import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

const nav = [
  { href: "/driver", label: "Home" },
  { href: "/driver/scan", label: "Scan" },
  { href: "/driver/map", label: "Map" },
  { href: "/driver/active", label: "Active Session" },
  { href: "/driver/history", label: "History" },
  { href: "/driver/profile", label: "Profile" }
];

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["driver"]);
  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
