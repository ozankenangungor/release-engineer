import { beforeAll, afterAll } from "vitest";

const originalFetch = globalThis.fetch;
beforeAll(() => {
  globalThis.fetch = async () => {
    throw new Error("Network calls are disabled in tests. Supply an explicit upstream mock.");
  };
});
afterAll(() => { globalThis.fetch = originalFetch; });
