import Link from "next/link";

import { RegisterForm } from "@/app/register/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-5 inline-flex text-sm font-semibold text-mint">
          SmartPark
        </Link>
        <RegisterForm />
      </div>
    </main>
  );
}
