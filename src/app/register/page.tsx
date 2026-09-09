import { RegisterForm } from "@/app/register/register-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <Breadcrumbs
          className="mb-5"
          items={[{ label: "SmartPark", href: "/" }, { label: "Log in", href: "/login" }, { label: "Register driver" }]}
        />
        <RegisterForm />
      </div>
    </main>
  );
}
