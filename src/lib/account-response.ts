import "server-only";
import { AnalysisError } from "./errors";
export const privateHeaders = {
  "Cache-Control": "no-store, private",
  Vary: "Cookie, Authorization",
};
export function accountFailure(error: unknown) {
  const known = error instanceof AnalysisError;
  return Response.json(
    {
      error: {
        code: known ? error.code : "ACCOUNT_UNAVAILABLE",
        message: known
          ? error.message
          : "Your account could not be updated. Please try again later.",
      },
    },
    { status: known ? error.status : 503, headers: privateHeaders },
  );
}
