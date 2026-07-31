"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";

type PermissionState = NotificationPermission | "unsupported";

export function SessionAlerts({ endTime, bookingReference }: { endTime?: string; bookingReference: string }) {
  const [permission, setPermission] = useState<PermissionState>("default");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPermission("Notification" in window ? Notification.permission : "unsupported");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!endTime || permission !== "granted") return;

    const timers: number[] = [];
    const endAt = Date.parse(endTime);
    for (const minutes of [15, 5]) {
      const delay = endAt - Date.now() - minutes * 60_000;
      if (delay <= 0) continue;
      timers.push(
        window.setTimeout(() => {
          new Notification(`Parking ends in ${minutes} minutes`, {
            body: `${bookingReference} is almost out of time. Open SmartPark to extend your session.`,
            icon: "/icons/icon-192.svg",
            tag: `smartpark-${bookingReference}-${minutes}`
          });
        }, delay),
      );
    }

    const expiryDelay = endAt - Date.now();
    if (expiryDelay > 0) {
      timers.push(
        window.setTimeout(() => {
          new Notification("Parking time has ended", {
            body: `${bookingReference} may now require warden attention.`,
            icon: "/icons/icon-192.svg",
            tag: `smartpark-${bookingReference}-expired`
          });
        }, expiryDelay),
      );
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [bookingReference, endTime, permission]);

  async function enableAlerts() {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(await Notification.requestPermission());
  }

  const exactEnd = endTime
    ? new Intl.DateTimeFormat("en-GH", { hour: "numeric", minute: "2-digit", weekday: "short" }).format(
        new Date(endTime),
      )
    : "Waiting for entry";

  return (
    <div className="mt-5 flex flex-col gap-4 rounded-lg border border-ink/10 bg-lane p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-signal shadow-sm">
          {permission === "granted" ? <BellRing size={19} aria-hidden="true" /> : <Clock3 size={19} aria-hidden="true" />}
        </span>
        <div>
          <p className="font-semibold text-ink">Ends {exactEnd}</p>
          <p className="mt-1 text-sm text-asphalt/65">
            {permission === "granted"
              ? "15-minute and 5-minute alerts are on for this session."
              : permission === "denied"
                ? "Notifications are blocked in this browser."
                : permission === "unsupported"
                  ? "This browser does not support parking alerts."
                  : "Turn on alerts before parking time runs out."}
          </p>
        </div>
      </div>
      {permission === "default" ? (
        <Button type="button" variant="secondary" className="shrink-0" onClick={() => void enableAlerts()}>
          <Bell size={16} aria-hidden="true" /> Enable alerts
        </Button>
      ) : null}
    </div>
  );
}
