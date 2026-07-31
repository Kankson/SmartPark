import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold text-ink">Basic terms</h1>
        <p className="mt-4 leading-7 text-asphalt/80">
          The MVP demonstrates reservation, mock payment, QR ticket validation, and enforcement workflows.
          Real-money deployment requires provider integration, operational policy approval, and a security review.
        </p>
      </Card>
    </main>
  );
}
