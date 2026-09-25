import { NextResponse, type NextRequest } from "next/server";

// Pass the path to server components so the top bar can mark the current tab.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-pathname", req.nextUrl.pathname);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
