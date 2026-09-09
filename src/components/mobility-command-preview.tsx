import { BadgeCheck, Camera, CarFront, CreditCard, MapPin, QrCode, ShieldAlert } from "lucide-react";

const bays = [
  { code: "CMA-01", status: "Free", className: "border-mint/60 bg-mint/25 text-mint" },
  { code: "CMA-02", status: "Reserved", className: "border-signal/60 bg-signal/25 text-blue-100" },
  { code: "CMA-03", status: "Occupied", className: "border-caution/70 bg-caution/25 text-amber-100" },
  { code: "HSB-11", status: "Free", className: "border-mint/60 bg-mint/25 text-mint" },
  { code: "IAC-06", status: "Active", className: "border-white/50 bg-white/20 text-white" },
  { code: "HSB-03", status: "Expired", className: "border-breach/70 bg-breach/30 text-red-100" }
];

const checks = [
  { icon: CreditCard, label: "Wallet", value: "Paid" },
  { icon: QrCode, label: "Gate QR", value: "Valid" },
  { icon: Camera, label: "Plate", value: "Match" }
];

export function MobilityCommandPreview() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-city-grid opacity-70" />
      <div
        className="absolute left-1/2 top-14 w-[min(1100px,94vw)] -translate-x-1/2 rotate-[-1.5deg] opacity-95"
        data-motion="stagger"
      >
        <div className="rounded-lg border border-white/15 bg-[#132332]/90 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-md">
          <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative min-h-[470px] overflow-hidden rounded-md border border-white/10 bg-[#17212b] p-4">
              <div className="absolute inset-y-0 left-1/2 w-14 -translate-x-1/2 bg-white/5">
                <div className="mx-auto h-full w-px border-l border-dashed border-white/35" />
              </div>
              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white">
                <MapPin size={15} />
                City Centre Live
              </div>
              <div className="absolute right-5 top-5 rounded-md bg-white px-3 py-2 text-xs font-bold text-ink">
                Live availability
              </div>

              <div className="relative mt-20 grid grid-cols-2 gap-x-20 gap-y-4">
                {bays.map((bay) => (
                  <div
                    key={bay.code}
                    className={`min-h-24 rounded-md border p-3 shadow-[0_14px_28px_rgba(0,0,0,0.18)] ${bay.className}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{bay.code}</span>
                      <span className="h-2.5 w-2.5 rounded-full bg-current" data-motion={bay.status === "Expired" ? "pulse" : undefined} />
                    </div>
                    <p className="mt-5 text-sm font-semibold">{bay.status}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-current"
                        style={{ width: bay.status === "Free" ? "28%" : bay.status === "Expired" ? "92%" : "64%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
                {checks.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/10 p-3 text-white">
                    <Icon className="text-mint" size={18} />
                    <p className="mt-3 text-xs text-white/60">{label}</p>
                    <p className="text-sm font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-md border border-white/10 bg-white/10 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/55">Driver pass</p>
                    <p className="mt-1 text-2xl font-bold">SP-260714-ACTIVE</p>
                  </div>
                  <BadgeCheck className="text-mint" size={30} />
                </div>
                <div className="mt-5 rounded-md bg-white p-4 text-ink">
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <span
                        key={index}
                        className={`aspect-square rounded-sm ${index % 3 === 0 || index % 7 === 0 ? "bg-ink" : "bg-ink/10"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-white/55">Space</p>
                    <p className="font-bold">CMA-03</p>
                  </div>
                  <div>
                    <p className="text-white/55">Ends in</p>
                    <p className="font-bold text-mint">01:24</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-breach/40 bg-breach/20 p-4 text-white">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="text-red-200" />
                  <div>
                    <p className="text-sm font-bold">Violation watch</p>
                    <p className="text-xs text-white/60">HSB-03 overstayed by 24 min</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-white/10 p-4 text-white">
                <div className="flex items-center gap-3">
                  <CarFront className="text-signal" />
                  <div>
                    <p className="text-sm font-bold">Plate checker</p>
                    <p className="text-xs text-white/60">GT 8841-21 matched active session</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
