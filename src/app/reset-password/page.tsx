import { Card } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md">
        <h1 className="text-2xl font-bold text-ink">Reset password</h1>
        <p className="mt-3 text-sm leading-6 text-asphalt/75">
          This page is reserved for the Supabase reset-password callback in the production-backed setup.
        </p>
      </Card>
    </main>
  );
}
