"use client";

import { useState } from "react";
import { Camera, QrCode } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormError, Label, Select } from "@/components/ui/form";

type Result = {
  result: string;
  message: string;
  booking?: { bookingReference: string; status: string; endTime?: string };
  vehicle?: { plateNumber: string };
  spot?: { spotCode: string };
  zone?: { name: string };
};

export function QrScannerPanel({ initialPayload = "" }: { initialPayload?: string }) {
  const [payload, setPayload] = useState(initialPayload);
  const [mode, setMode] = useState<"entry" | "verify" | "exit">("entry");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  async function submit(scannedPayload = payload) {
    setError("");
    setResult(null);
    const response = await fetch("/api/qr/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: scannedPayload, mode })
    });
    const data = (await response.json()) as Result & { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not validate ticket.");
      return;
    }
    setResult(data);
  }

  async function startCamera() {
    setError("");
    setCameraReady(true);
    const { Html5QrcodeScanner } = await import("html5-qrcode");
    const scanner = new Html5QrcodeScanner(
      "smartpark-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );
    scanner.render(
      (decodedText) => {
        setPayload(decodedText);
        void submit(decodedText);
        scanner.clear().catch(() => undefined);
      },
      () => undefined,
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <div className="flex items-center gap-2">
          <QrCode className="text-mint" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-ink">QR scanner</h1>
        </div>
        <div className="mt-5 grid gap-4">
          <Field>
            <Label htmlFor="mode">Mode</Label>
            <Select id="mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
              <option value="entry">ENTRY</option>
              <option value="verify">VERIFY</option>
              <option value="exit">EXIT</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="payload">QR payload</Label>
            <textarea
              id="payload"
              className="min-h-28 w-full rounded-md border border-ink/15 bg-white p-3 text-sm outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              placeholder="Scan a ticket or paste its verification link"
            />
          </Field>
          {error ? <FormError>{error}</FormError> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void submit()} disabled={!payload}>
              Validate ticket
            </Button>
            <Button type="button" variant="secondary" onClick={() => void startCamera()}>
              <Camera size={16} aria-hidden="true" />
              Use camera
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-ink">Result</h2>
        {cameraReady ? <div id="smartpark-reader" className="mt-4 overflow-hidden rounded-lg" /> : null}
        {result ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-ink">{result.message}</p>
              <StatusPill status={result.result} />
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-asphalt/60">Booking</dt>
                <dd className="font-semibold text-ink">{result.booking?.bookingReference ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-asphalt/60">Status</dt>
                <dd>{result.booking ? <StatusPill status={result.booking.status} /> : "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-asphalt/60">Plate</dt>
                <dd className="font-semibold text-ink">{result.vehicle?.plateNumber ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-asphalt/60">Space</dt>
                <dd className="font-semibold text-ink">{result.spot?.spotCode ?? "-"}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-4 text-sm text-asphalt/70">Scan or paste a QR payload to see validation details.</p>
        )}
      </Card>
    </div>
  );
}
