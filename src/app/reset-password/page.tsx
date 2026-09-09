import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Breadcrumbs
          className="mb-5"
          items={[
            { label: "SmartPark", href: "/" },
            { label: "Log in", href: "/login" },
            { label: "Reset password" }
          ]}
        />
        <Card>
          <h1 className="text-2xl font-bold text-ink">Reset password</h1>
          <p className="mt-3 text-sm leading-6 text-asphalt/75">
            This page is reserved for the Supabase reset-password callback in the production-backed setup.
          </p>
        </Card>
      </div>
    </main>
  );
}
