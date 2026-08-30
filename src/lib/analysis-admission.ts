import "server-only";
import { AnalysisError } from "./errors";

// One bounded, content-free budget per warm server instance. This supplements
// platform protection; independent serverless instances do not share this state.
export function createAnalysisAdmission(now = Date.now) {
  const starts: number[] = [];
  let active = 0;
  return function acquire() {
    const current = now();
    while (starts.length && starts[0]! <= current - 60_000) starts.shift();
    if (active >= 2 || starts.length >= 6) {
      throw new AnalysisError(
        "SERVICE_BUSY",
        "The beta is handling its current request limit. Wait a minute, then try again.",
        429,
      );
    }
    starts.push(current);
    active++;
    let released = false;
    return () => {
      if (!released) active--;
      released = true;
    };
  };
}

export const acquireAnalysisSlot = createAnalysisAdmission();

export function assertBrowserOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Origin-free CLI requests remain supported. These checks prevent another
  // browser site spending credits; they do not authenticate scripts or clients.
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  ) {
    throw new AnalysisError(
      "CROSS_ORIGIN_REQUEST",
      "Submit the pull request from the Release Engineer website.",
      403,
    );
  }
}
