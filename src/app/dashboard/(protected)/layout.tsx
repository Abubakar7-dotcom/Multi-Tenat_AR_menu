import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentRestaurantStaff } from "@/lib/supabase/server-session";
import { SignOutButton } from "@/components/auth/sign-out-button";

// The real auth gate for every /dashboard/* route except /login (outside this route group).
// Proxy only confirms A session cookie exists; THIS verifies the signed-in user is actually
// restaurant staff (admin_users), not a platform_admin or nobody (Hard Rule #1
// belt-and-suspenders). Hard Rule #7: this dashboard exposes content editing only — no design
// controls, no token/section editing, ever. Those live exclusively in Studio.
export default async function DashboardProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentRestaurantStaff();
  if (!staff) {
    redirect("/dashboard/login");
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <span className="font-semibold">Dashboard</span>
          <Link href="/dashboard/items" className="text-gray-600 hover:text-black">
            Items
          </Link>
          <Link href="/dashboard/categories" className="text-gray-600 hover:text-black">
            Categories
          </Link>
          <Link href="/dashboard/billing" className="text-gray-600 hover:text-black">
            Billing
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{staff.email}</span>
          <SignOutButton redirectTo="/dashboard/login" />
        </div>
      </div>
      {children}
    </div>
  );
}
