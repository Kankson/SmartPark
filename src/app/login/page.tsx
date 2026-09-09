import Link from "next/link";

import { LoginForm } from "@/app/login/login-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Breadcrumbs className="mb-5" items={[{ label: "SmartPark", href: "/" }, { label: "Log in" }]} />
        <LoginForm />
        <div className="mt-5 flex justify-between text-sm text-asphalt/75">
          <Link href="/register" className="font-semibold text-ink hover:text-mint">
            Register driver
          </Link>
          <Link href="/forgot-password" className="font-semibold text-ink hover:text-mint">
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
