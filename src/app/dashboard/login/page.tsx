import { LoginForm } from "@/components/auth/login-form";

export default function DashboardLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-xl font-bold">Merchant Dashboard</h1>
      <LoginForm redirectTo="/dashboard" />
    </main>
  );
}
