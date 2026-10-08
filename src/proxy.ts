import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";

// Resource handlers perform authorization. Public editorial pages stay static.
const clerk = clerkMiddleware(
  () => {},
  (request) => ({
    authorizedParties: [
      "https://releaseengineer.tech",
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
      ...(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith(
        "pk_test_",
      ) && ["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)
        ? [request.nextUrl.origin]
        : []),
    ],
  }),
);
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // Offline CI can still verify public routes and configured-service failures.
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  )
    return NextResponse.next();
  return clerk(request, event);
}
export const config = {
  matcher: [
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/account/:path*",
    "/api/account/:path*",
    "/api/analyze",
    "/api/billing/checkout",
    "/api/billing/portal",
  ],
};
