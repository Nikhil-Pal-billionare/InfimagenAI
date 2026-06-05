import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          ),
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/auth")) return res;
  if (!session && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")))
    return NextResponse.redirect(new URL("/sign-in", req.url));
  if (session && (pathname === "/sign-in" || pathname === "/sign-up"))
    return NextResponse.redirect(new URL("/dashboard", req.url));
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/sign-in", "/sign-up"],
};
