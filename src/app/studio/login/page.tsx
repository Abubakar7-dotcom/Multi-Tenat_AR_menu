import { LoginForm } from "./login-form";

export default function StudioLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-xl font-bold">Studio</h1>
      <LoginForm />
    </main>
  );
}
