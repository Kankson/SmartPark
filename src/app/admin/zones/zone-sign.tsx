import { QRCodeSVG } from "qrcode.react";

export function ZoneSign({ payload, code, name }: { payload: string; code: string; name: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-md border border-ink/10 bg-lane p-4">
      <span className="inline-flex rounded-md border border-ink/10 bg-white p-2">
        <QRCodeSVG value={payload} size={112} level="H" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase text-mint">Scan to park</p>
        <p className="mt-1 text-2xl font-bold text-ink">{code}</p>
        <p className="text-sm text-asphalt/65">{name}</p>
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-asphalt/70">
          <span className="h-2 w-2 rounded-full bg-mint" /> Signed SmartPark zone code
        </p>
      </div>
    </div>
  );
}
