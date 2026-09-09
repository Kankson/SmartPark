"use client";

import { CheckCircle2, Clipboard, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface AzaConnectionCheckProps {
  webhookUrl: string;
  canTest: boolean;
}

type CheckResult = {
  tone: "success" | "error";
  message: string;
} | null;

export function AzaConnectionCheck({ webhookUrl, canTest }: AzaConnectionCheckProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult>(null);

  async function checkConnection() {
    setChecking(true);
    setResult(null);

    try {
      const response = await fetch("/api/payments/aza-health", { method: "POST" });
      const payload = await response.json() as { message?: string; error?: string };
      setResult({
        tone: response.ok ? "success" : "error",
        message: payload.message ?? payload.error ?? "The AZA connection check failed."
      });
    } catch {
      setResult({ tone: "error", message: "SmartPark could not run the connection check." });
    } finally {
      setChecking(false);
    }
  }

  async function copyWebhookUrl() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setResult({ tone: "success", message: "Webhook URL copied." });
    } catch {
      setResult({ tone: "error", message: "Copy failed. Select the URL and copy it manually." });
    }
  }

  return (
    <div className="mt-5 border-t border-ink/10 pt-5">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={checkConnection} disabled={!canTest || checking}>
          {checking ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {checking ? "Checking" : "Test AZA connection"}
        </Button>
        <Button type="button" variant="secondary" onClick={copyWebhookUrl}>
          <Clipboard className="size-4" />
          Copy webhook URL
        </Button>
      </div>

      {result ? (
        <p
          className={`mt-3 flex items-center gap-2 text-sm font-medium ${
            result.tone === "success" ? "text-emerald-700" : "text-red-700"
          }`}
          role="status"
          aria-live="polite"
        >
          {result.tone === "success"
            ? <CheckCircle2 className="size-4 shrink-0" />
            : <TriangleAlert className="size-4 shrink-0" />}
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
