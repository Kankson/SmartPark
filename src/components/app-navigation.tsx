"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock3,
  History,
  Home,
  Map,
  MapPinned,
  QrCode,
  ScanLine,
  Settings,
  ShieldAlert,
  SquareParking,
  UserRound,
  UsersRound,
  type LucideIcon
} from "lucide-react";

type NavItem = { href: string; label: string };

const icons: Record<string, LucideIcon> = {
  Home,
  Dashboard: Home,
  Scan: QrCode,
  Scanner: QrCode,
  Map,
  "Active Session": Clock3,
  History,
  Profile: UserRound,
  Spaces: SquareParking,
  Plates: ScanLine,
  Violations: ShieldAlert,
  Zones: MapPinned,
  Wardens: UsersRound,
  Settings
};

function isActive(pathname: string, href: string) {
  const isRoleHome = /^\/(driver|warden|admin)$/.test(href);
  return pathname === href || (!isRoleHome && pathname.startsWith(`${href}/`));
}

function mobileLabel(label: string) {
  if (label === "Active Session") return "Active";
  if (label === "Dashboard") return "Home";
  return label;
}

export function AppNavigation({ nav, mobile = false }: { nav: NavItem[]; mobile?: boolean }) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur md:hidden"
        aria-label="Mobile navigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="mx-auto grid h-16 max-w-lg"
          style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
        >
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = icons[item.label] ?? Home;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors ${
                  active ? "text-mint" : "text-asphalt/70 hover:text-ink"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span className="max-w-full truncate">{mobileLabel(item.label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              active ? "bg-ink text-white" : "text-asphalt hover:bg-kerb hover:text-ink"
            }`}
            data-lift
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
