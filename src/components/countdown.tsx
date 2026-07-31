"use client";

import { useEffect, useMemo, useState } from "react";

export function Countdown({ endTime }: { endTime?: string }) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const seconds = useMemo(() => {
    if (!endTime || now === 0) return 0;
    return Math.max(0, Math.floor((Date.parse(endTime) - now) / 1000));
  }, [endTime, now]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return (
    <span className="tabular-nums">
      {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:
      {remainingSeconds.toString().padStart(2, "0")}
    </span>
  );
}
