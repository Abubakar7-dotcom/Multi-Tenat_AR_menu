import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route-level auth boundary for /studio/* and /dashboard/* (PLAN.md §6: "middleware checks
// session against platform_admins/admin_users for every protected route ... in addition to RLS
// — belt-and-suspenders"). Named `proxy` per Next.js 16's rename of the middleware file
// convention. This only checks that A session exists and refreshes its cookies; WHICH identity
// space that session belongs to (platform_admins vs admin_users) is re-verified server-side per
// request by each area's own layout (getCurrentPlatformAdmin / getCurrentRestaurantStaff in
// server-session.ts) since this proxy can't safely do a DB round trip cheaply on every asset
// request, and a Studio session must never grant Dashboard access or vice versa.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isStudioRoute = path.startsWith("/studio");
  const isStudioLogin = path === "/studio/login";
  if (isStudioRoute && !isStudioLogin && !user) {
    return NextResponse.redirect(new URL("/studio/login", request.url));
  }

  const isDashboardRoute = path.startsWith("/dashboard");
  const isDashboardLogin = path === "/dashboard/login";
  if (isDashboardRoute && !isDashboardLogin && !user) {
    return NextResponse.redirect(new URL("/dashboard/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/studio/:path*", "/dashboard/:path*"],
};
