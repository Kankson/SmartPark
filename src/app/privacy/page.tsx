import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold text-ink">Privacy notice</h1>
        <p className="mt-4 leading-7 text-asphalt/80">
          SmartPark stores only the data needed for parking booking, payment verification, QR validation,
          plate lookup, and audit trails. Real payment credentials and private card data must never be stored
          in this application.
        </p>
      </Card>
    </main>
  );
}
