import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlatformAdmin } from "@/lib/supabase/server-session";
import { curatedFontsPreviewHref } from "@/lib/theme/fonts";
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
      {/* Whole curated list at preview weights so the font picker's live preview line renders
          in the real family. Studio-only cost — public pages load just their own two fonts. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={curatedFontsPreviewHref()} />
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
        <Link href="/studio" className="text-sm font-semibold hover:underline">
          Studio
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{admin.email}</span>
          <SignOutButton redirectTo="/studio/login" />
        </div>
      </div>
      {children}
    </div>
  );
}
