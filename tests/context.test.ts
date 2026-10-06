import { describe, expect, it } from "vitest";
import { buildReviewContext, CONTEXT_LIMITS, byteLength } from "@/lib/context";
import { file, pullRequest } from "./fixtures";

describe("review context budget", () => {
  it("preserves complete small changes and branch metadata", () => {
    const result = buildReviewContext(pullRequest());
    expect(result.coverage.partial).toBe(false);
    expect(result.warnings).toEqual([]);
    expect(JSON.parse(result.json).pullRequest.headBranch).toBe("improve-app");
    expect(JSON.parse(result.json).files[0].patch).toContain("+new");
  });
  it("uses deterministic priority rather than GitHub file ordering", () => {
    const files = [
      file("docs/readme.md"),
      file("pnpm-lock.yaml"),
      file("src/z.ts"),
      file("src/auth.ts"),
      file("src/a.ts"),
    ];
    const limits = { ...CONTEXT_LIMITS, maxFiles: 2 };
    const first = buildReviewContext(
      pullRequest({ files, changedFileCount: 5 }),
      limits,
    );
    const second = buildReviewContext(
      pullRequest({ files: [...files].reverse(), changedFileCount: 5 }),
      limits,
    );
    expect(first.json).toBe(second.json);
    expect(
      JSON.parse(first.json).files.map(
        (entry: { filename: string }) => entry.filename,
      ),
    ).toEqual(["src/auth.ts", "src/a.ts"]);
    expect(first.coverage.partial).toBe(true);
    expect(first.warnings[0]).toContain("2 of 5");
  });
  it("caps the serialized UTF-8 payload including escaping and metadata", () => {
    const files = Array.from({ length: 150 }, (_, index) =>
      file(`src/file-${index}.ts`, '😀\\"\n'.repeat(12_000)),
    );
    const result = buildReviewContext(
      pullRequest({ files, changedFileCount: 150, body: "🧪".repeat(20_000) }),
    );
    expect(byteLength(result.json)).toBeLessThanOrEqual(
      CONTEXT_LIMITS.maxBytes,
    );
    expect(result.coverage.includedFiles).toBeLessThanOrEqual(
      CONTEXT_LIMITS.maxFiles,
    );
    expect(result.coverage.descriptionTruncated).toBe(true);
    expect(result.coverage.truncatedPatches).toBeGreaterThan(0);
    for (const entry of JSON.parse(result.json).files) {
      expect(byteLength(entry.patch)).toBeLessThanOrEqual(
        CONTEXT_LIMITS.maxPatchBytes,
      );
      expect(entry.patch).not.toContain("\ufffd");
    }
  });
  it("discloses missing patches and files not retrieved", () => {
    const noPatch = { ...file("image.png"), patch: undefined };
    const result = buildReviewContext(
      pullRequest({
        files: [noPatch],
        changedFileCount: 600,
        filesTruncated: true,
      }),
    );
    expect(result.coverage).toMatchObject({
      partial: true,
      missingPatches: 1,
      includedFiles: 1,
      filesNotRetrieved: true,
    });
    expect(
      result.warnings.some((value) => value.includes("did not expose a patch")),
    ).toBe(true);
    expect(JSON.parse(result.json).files[0].patch).toBeNull();
  });
  it("does not mutate the original PR", () => {
    const pr = pullRequest({
      files: [file("z.ts"), file("a.ts")],
      changedFileCount: 2,
    });
    const before = JSON.stringify(pr);
    buildReviewContext(pr);
    expect(JSON.stringify(pr)).toBe(before);
  });
});
