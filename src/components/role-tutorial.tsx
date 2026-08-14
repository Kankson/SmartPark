"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  History,
  Map,
  QrCode,
  ScanLine,
  SquareParking,
  X,
  type LucideIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { type UserRole } from "@/server/domain";

type TutorialStep = {
  title: string;
  description: string;
  tip: string;
  icon: LucideIcon;
};

const driverSteps: TutorialStep[] = [
  {
    title: "Find a parking zone",
    description: "Open Map to compare availability and price, or use Scan when a parking-zone QR sign is available.",
    tip: "Map is the easiest starting point when testing the app remotely.",
    icon: Map
  },
  {
    title: "Book an available space",
    description: "Choose a zone, vehicle, parking space and duration. Review the calculated fee before continuing.",
    tip: "The selected space is held temporarily while payment is being completed.",
    icon: SquareParking
  },
  {
    title: "Complete payment",
    description: "Finish the payment checkout. With AZA enabled, SmartPark issues the QR ticket after provider confirmation.",
    tip: "Do not close the payment result immediately; wait for the confirmed booking screen.",
    icon: CreditCard
  },
  {
    title: "Present the entry ticket",
    description: "Open the booking QR ticket and let the Warden scan it in ENTRY mode. A valid scan starts the parking timer.",
    tip: "The QR can also be opened with a phone camera and handed to a logged-in Warden scanner.",
    icon: QrCode
  },
  {
    title: "Monitor the session",
    description: "Use Active to view the remaining time. Extend the session before it expires when more time is needed.",
    tip: "History contains previous and current booking records and their statuses.",
    icon: Clock3
  },
  {
    title: "Validate the exit",
    description: "At departure, show the same ticket to the Warden for an EXIT scan. The space is then released.",
    tip: "A completed booking remains available under History.",
    icon: History
  }
];

const wardenSteps: TutorialStep[] = [
  {
    title: "Review the live dashboard",
    description: "Start on Dashboard to see available, occupied and overdue spaces. Handle critical violations first.",
    tip: "Parking data refreshes automatically; the refresh control can request an immediate update.",
    icon: AlertTriangle
  },
  {
    title: "Validate vehicle entry",
    description: "Open Scanner, select ENTRY and scan the Driver's ticket. Confirm the result, plate and assigned space.",
    tip: "Allow camera access when prompted. Camera scanning requires the secure Vercel address on mobile.",
    icon: Camera
  },
  {
    title: "Check spaces and plates",
    description: "Use Spaces during patrol and Plates to search or scan a registration number for a matching booking.",
    tip: "Plate recognition is supporting evidence; visually confirm the number before enforcement.",
    icon: ScanLine
  },
  {
    title: "Handle violations",
    description: "Open Violations, verify the vehicle and choose the appropriate action. Add a useful note to the record.",
    tip: "Confirm genuine violations and dismiss false or resolved alerts.",
    icon: AlertTriangle
  },
  {
    title: "Validate vehicle exit",
    description: "Return to Scanner, select EXIT and scan the same ticket. A valid result completes the session.",
    tip: "Use VERIFY when you only need to check validity without changing entry or exit state.",
    icon: QrCode
  }
];

export function RoleTutorial({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const steps = role === "warden" ? wardenSteps : role === "driver" ? driverSteps : [];
  const storageKey = `smartpark-tutorial-${role}-v1`;

  const finish = useCallback(() => {
    window.localStorage.setItem(storageKey, "complete");
    setOpen(false);
    setStepIndex(0);
  }, [storageKey]);

  useEffect(() => {
    if (!steps.length || window.localStorage.getItem(storageKey)) return;
    const timer = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(timer);
  }, [steps.length, storageKey]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [finish, open]);

  if (!steps.length) return null;

  const step = steps[stepIndex];
  const StepIcon = step.icon;
  const isLast = stepIndex === steps.length - 1;

  function restart() {
    setStepIndex(0);
    setOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="h-10 w-10 px-0"
        onClick={restart}
        title={`Open ${role} tutorial`}
        aria-label={`Open ${role} tutorial`}
      >
        <CircleHelp size={18} aria-hidden="true" />
      </Button>

      {open ? createPortal(
        <div className="fixed inset-0 z-[70] grid place-items-end bg-ink/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-5">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            tabIndex={-1}
            className="w-full overflow-hidden rounded-t-lg border border-white/10 bg-white shadow-2xl outline-none sm:max-w-lg sm:rounded-lg"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase text-mint">{role} guide</p>
                <p className="mt-1 text-sm font-semibold text-asphalt">
                  Step {stepIndex + 1} of {steps.length}
                </p>
              </div>
              <button
                type="button"
                onClick={finish}
                className="grid h-10 w-10 place-items-center rounded-md text-asphalt transition hover:bg-kerb hover:text-ink"
                aria-label="Close tutorial"
                title="Close tutorial"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 py-6 sm:px-7">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-ink text-mint">
                <StepIcon size={25} aria-hidden="true" />
              </div>
              <h2 id="tutorial-title" className="mt-5 text-2xl font-bold text-ink">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-asphalt/80">{step.description}</p>
              <div className="mt-5 border-l-4 border-mint bg-lane px-4 py-3 text-sm leading-6 text-asphalt">
                <span className="font-bold text-ink">Tip:</span> {step.tip}
              </div>

              <div className="mt-6 flex gap-2" aria-label="Tutorial progress">
                {steps.map((item, index) => (
                  <span
                    key={item.title}
                    className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-mint" : "bg-ink/10"}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-ink/10 bg-lane px-5 py-4 sm:px-7">
              {stepIndex === 0 ? (
                <button type="button" onClick={finish} className="text-sm font-semibold text-asphalt hover:text-ink">
                  Skip tutorial
                </button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => setStepIndex((index) => index - 1)}>
                  <ChevronLeft size={17} aria-hidden="true" />
                  Back
                </Button>
              )}
              <Button
                type="button"
                onClick={() => (isLast ? finish() : setStepIndex((index) => index + 1))}
              >
                {isLast ? "Finish" : "Next"}
                {!isLast ? <ChevronRight size={17} aria-hidden="true" /> : null}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
