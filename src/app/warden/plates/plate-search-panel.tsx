"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ScanLine, Search } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormError, Input, Label } from "@/components/ui/form";

type PlateResult = {
  normalizedPlateNumber: string;
  vehicle?: { plateNumber: string; make: string; model: string; colour: string };
  booking?: { bookingReference: string; status: string; endTime?: string };
  spot?: { spotCode: string };
  zone?: { name: string };
  payment?: { status: string };
  violation?: { status: string; overstayMinutes: number };
};

type RecognitionResult = {
  plateNumber: string;
  confidence: number;
  provider: string;
};

export function PlateSearchPanel({ initialPlateNumber = "GT 8841-21" }: { initialPlateNumber?: string }) {
  const [plateNumber, setPlateNumber] = useState(initialPlateNumber);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PlateResult | null>(null);
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function search(recognition = false) {
    setError("");
    setResult(null);
    setSearching(true);
    try {
      const response = await fetch("/api/plates/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plateNumber, recognition })
      });
      const data = (await response.json()) as PlateResult & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Plate search failed.");
        return;
      }
      setResult(data);
    } catch {
      setError("The plate check could not reach SmartPark. Try again when the connection returns.");
    } finally {
      setSearching(false);
    }
  }

  async function capturePlate(file?: File) {
    if (!file) return;
    setError("");
    setResult(null);
    setRecognition(null);
    setRecognizing(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.set("image", file);
      const response = await fetch("/api/plates/recognize", { method: "POST", body: formData });
      const data = (await response.json()) as { recognition?: RecognitionResult; error?: string };
      if (!response.ok || !data.recognition) {
        setError(data.error ?? "The plate could not be read.");
        return;
      }
      setRecognition(data.recognition);
      setPlateNumber(data.recognition.plateNumber);
    } catch {
      setError("The camera scan could not reach SmartPark. You can still enter the plate manually.");
    } finally {
      setRecognizing(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <div className="flex items-center gap-2">
          <Search className="text-mint" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-ink">Number-plate search</h1>
        </div>
        <div className="mt-5 grid gap-4">
          <Field>
            <Label htmlFor="plateNumber">Plate number</Label>
            <Input
              id="plateNumber"
              value={plateNumber}
              onChange={(event) => {
                setPlateNumber(event.target.value.toUpperCase());
                setRecognition(null);
              }}
              placeholder="GR 1234-22"
            />
          </Field>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(event) => void capturePlate(event.target.files?.[0])}
          />
          {error ? <FormError>{error}</FormError> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={searching || !plateNumber.trim()} onClick={() => void search(Boolean(recognition))}>
              <Search size={16} aria-hidden="true" />
              {searching ? "Checking..." : recognition ? "Confirm and verify" : "Search plate"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={recognizing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} aria-hidden="true" />
              {recognizing ? "Reading plate..." : "Scan with camera"}
            </Button>
          </div>
          {previewUrl ? (
            <div className="overflow-hidden rounded-lg border border-ink/10 bg-lane">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Captured vehicle plate" className="h-40 w-full object-cover" />
              <div className="p-3">
                {recognition ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <CheckCircle2 size={16} className="text-mint" aria-hidden="true" />
                        Detected {recognition.plateNumber}
                      </p>
                      <p className="mt-1 text-xs text-asphalt/60">
                        {Math.round(recognition.confidence * 100)}% confidence - confirm before enforcement
                      </p>
                    </div>
                    <ScanLine className="shrink-0 text-signal" aria-hidden="true" />
                  </div>
                ) : (
                  <p className="text-sm text-asphalt/65">{recognizing ? "Reading captured plate..." : "Plate not detected."}</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-ink">Verification result</h2>
        {result ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-ink/10 bg-lane p-4">
              <p className="text-sm text-asphalt/60">Normalized plate</p>
              <p className="mt-1 text-2xl font-bold text-ink">{result.normalizedPlateNumber}</p>
            </div>
            {result.booking ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-asphalt/60">Vehicle</dt>
                  <dd className="font-semibold text-ink">{result.vehicle?.plateNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm text-asphalt/60">Booking</dt>
                  <dd className="font-semibold text-ink">{result.booking.bookingReference}</dd>
                </div>
                <div>
                  <dt className="text-sm text-asphalt/60">Status</dt>
                  <dd>
                    <StatusPill status={result.booking.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-asphalt/60">Payment</dt>
                  <dd>{result.payment ? <StatusPill status={result.payment.status} /> : "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-asphalt/60">Zone</dt>
                  <dd className="font-semibold text-ink">{result.zone?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-asphalt/60">Space</dt>
                  <dd className="font-semibold text-ink">{result.spot?.spotCode}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-asphalt/70">No active, reserved, or expired booking was found.</p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-asphalt/70">Search a plate to check booking, payment, and timer status.</p>
        )}
      </Card>
    </div>
  );
}
