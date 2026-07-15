import { redirect } from "next/navigation";
import { getCurrentPlatformAdmin } from "@/lib/supabase/server-session";
import { SignOutButton } from "@/components/auth/sign-out-button";

// The real auth gate for every /studio/* route except /login (outside this route group).
// Middleware only confirms a session cookie exists; THIS is what verifies the signed-in user
// is actually a platform_admin (Hard Rule #1 belt-and-suspenders: never rely on one layer).
export default async function StudioProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentPlatformAdmin();
  if (!admin) {
    redirect("/studio/login");
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <span className="text-sm font-semibold">Studio</span>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{admin.email}</span>
          <SignOutButton redirectTo="/studio/login" />
        </div>
      </div>
      {children}
    </div>
  );
}
