"use client";

import { useEffect, useState } from "react";
import { Camera, Keyboard, ScanLine, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormError, Input, Label } from "@/components/ui/form";

type ZoneOption = { id: string; code: string; name: string; address: string };

export function ZoneScanner({ zones }: { zones: ZoneOption[] }) {
  const router = useRouter();
  const [cameraReady, setCameraReady] = useState(false);
  const [zoneCode, setZoneCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!cameraReady) return;

    let cancelled = false;
    let clearScanner: (() => Promise<void>) | undefined;

    void import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (cancelled) return;
      const scanner = new Html5QrcodeScanner(
        "smartpark-zone-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false,
      );
      clearScanner = () => scanner.clear();
      scanner.render(
        (payload) => {
          setPending(true);
          setError("");
          void fetch("/api/zones/resolve-qr", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ payload })
          })
            .then(async (response) => {
              const data = (await response.json()) as { zone?: ZoneOption; error?: string };
              if (!response.ok || !data.zone) throw new Error(data.error ?? "Zone code could not be verified.");
              await scanner.clear().catch(() => undefined);
              router.push(`/driver/book/${data.zone.id}`);
            })
            .catch((scanError: unknown) => {
              setPending(false);
              setError(scanError instanceof Error ? scanError.message : "Zone code could not be verified.");
            });
        },
        () => undefined,
      );
    });

    return () => {
      cancelled = true;
      void clearScanner?.().catch(() => undefined);
    };
  }, [cameraReady, router]);

  function openZone() {
    setError("");
    const normalized = zoneCode.trim().toUpperCase();
    const zone = zones.find((item) => item.code.toUpperCase() === normalized);
    if (!zone) {
      setError("Check the zone code printed on the parking sign.");
      return;
    }
    router.push(`/driver/book/${zone.id}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-mint">Quick park</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Scan or enter your zone</h1>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-mint/10 text-mint">
              <ScanLine aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Scan zone sign</h2>
              <p className="text-sm text-asphalt/65">Signed SmartPark codes open the correct parking zone.</p>
            </div>
          </div>
          {cameraReady ? (
            <div id="smartpark-zone-reader" className="mt-5 overflow-hidden rounded-lg border border-ink/10" />
          ) : (
            <button
              type="button"
              onClick={() => setCameraReady(true)}
              className="mt-5 grid min-h-72 w-full place-items-center rounded-lg border border-dashed border-ink/20 bg-lane text-center hover:border-mint/50 hover:bg-mint/5"
            >
              <span>
                <Camera className="mx-auto text-mint" size={36} aria-hidden="true" />
                <span className="mt-3 block font-semibold text-ink">Open phone camera</span>
              </span>
            </button>
          )}
          {pending ? <p className="mt-3 text-sm font-semibold text-mint">Verifying zone...</p> : null}
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Keyboard className="text-signal" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Enter zone code</h2>
          </div>
          <div className="mt-5 grid gap-4">
            <Field>
              <Label htmlFor="zoneCode">Zone code</Label>
              <Input
                id="zoneCode"
                value={zoneCode}
                onChange={(event) => setZoneCode(event.target.value.toUpperCase())}
                placeholder="CMA"
                autoCapitalize="characters"
                maxLength={8}
              />
            </Field>
            {error ? <FormError>{error}</FormError> : null}
            <Button type="button" disabled={!zoneCode.trim()} onClick={openZone}>
              Open parking zone
            </Button>
          </div>
          <div className="mt-6 border-t border-ink/10 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldCheck className="text-mint" size={17} aria-hidden="true" />
              Available zone codes
            </div>
            <div className="mt-3 grid gap-2">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setZoneCode(zone.code)}
                  className="flex items-center justify-between rounded-md border border-ink/10 bg-lane px-3 py-3 text-left hover:border-mint/30"
                >
                  <span className="min-w-0 pr-3">
                    <span className="block truncate text-sm font-semibold text-ink">{zone.name}</span>
                    <span className="block truncate text-xs text-asphalt/60">{zone.address}</span>
                  </span>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-mint shadow-sm">{zone.code}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
