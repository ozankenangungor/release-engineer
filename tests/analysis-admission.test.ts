import { describe, expect, it } from "vitest";
import {
  createAnalysisAdmission,
  assertBrowserOrigin,
} from "@/lib/analysis-admission";

describe("content-free per-instance analysis admission", () => {
  it("caps concurrent work and releases a slot only once", () => {
    const acquire = createAnalysisAdmission(() => 0);
    const first = acquire();
    acquire();
    expect(() => acquire()).toThrow("current request limit");
    first();
    first();
    acquire();
    expect(() => acquire()).toThrow("current request limit");
  });
  it("caps starts in a rolling minute, independently of concurrency", () => {
    let clock = 0;
    const acquire = createAnalysisAdmission(() => clock);
    for (let i = 0; i < 6; i++) acquire()();
    clock = 59_999;
    expect(() => acquire()).toThrow("current request limit");
    clock = 60_000;
    expect(() => acquire()()).not.toThrow();
  });
  it("retains later starts when the earliest one expires", () => {
    let clock = 0;
    const acquire = createAnalysisAdmission(() => clock);
    acquire()();
    clock = 30_000;
    for (let i = 0; i < 5; i++) acquire()();
    clock = 60_000;
    acquire()();
    expect(() => acquire()).toThrow("current request limit");
  });
  it("keeps an in-flight analysis counted when its rate window expires", () => {
    let clock = 0;
    const acquire = createAnalysisAdmission(() => clock);
    acquire();
    acquire();
    clock = 60_000;
    expect(() => acquire()).toThrow("current request limit");
  });
  it("accepts same-origin browser and origin-free CLI requests", () => {
    for (const headers of [
      {},
      {
        Origin: "https://releaseengineer.tech",
        "Sec-Fetch-Site": "same-origin",
      },
    ] as Record<string, string>[]) {
      expect(() =>
        assertBrowserOrigin(
          new Request("https://releaseengineer.tech/api/analyze", { headers }),
        ),
      ).not.toThrow();
    }
  });
});
