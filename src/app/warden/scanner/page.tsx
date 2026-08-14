import { QrScannerPanel } from "@/app/warden/scanner/qr-scanner-panel";

export default async function ScannerPage({ searchParams }: { searchParams: Promise<{ ticket?: string }> }) {
  const { ticket } = await searchParams;
  return <QrScannerPanel initialPayload={ticket ?? ""} />;
}
