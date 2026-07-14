import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route-level auth boundary for /studio/* (PLAN.md §6: "middleware checks session against
// platform_admins for every /studio/* route ... in addition to RLS — belt-and-suspenders").
// Named `proxy` per Next.js 16's rename of the middleware file convention. This only checks
// that a session exists and refreshes its cookies; membership in platform_admins is
// re-verified server-side per request via getCurrentPlatformAdmin() (server-session.ts) since
// this proxy can't safely do a DB round trip cheaply on every asset request. A session without
// platform_admin membership still gets redirected to login by the page/layout itself.
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
  const isLoginRoute = path === "/studio/login";

  if (isStudioRoute && !isLoginRoute && !user) {
    const loginUrl = new URL("/studio/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/studio/:path*"],
};
