import { describe, expect, it } from "vitest";
import { parseGitHubPullRequestUrl } from "@/lib/github-url";

describe("GitHub pull request URL parsing", () => {
  it("parses and canonicalizes a valid PR URL", () => {
    expect(
      parseGitHubPullRequestUrl(
        " https://github.com/owner-name/repo.name_v2/pull/42/ ",
      ),
    ).toEqual({
      owner: "owner-name",
      repository: "repo.name_v2",
      number: 42,
      url: "https://github.com/owner-name/repo.name_v2/pull/42",
    });
  });
  it.each([
    "",
    "not a URL",
    "http://github.com/o/r/pull/1",
    "https://example.com/o/r/pull/1",
    "https://github.com.evil.com/o/r/pull/1",
    "https://github.com@evil.com/o/r/pull/1",
    "https://evil.com@github.com/o/r/pull/1",
    "https://github.com:443/o/r/pull/1",
    "https://127.0.0.1/o/r/pull/1",
    "https://github.com/o/r/issues/1",
    "https://github.com/o/r/pull/1/files",
    "https://github.com/o/r/pull/0",
    "https://github.com/o/r/pull/-1",
    "https://github.com/o/r/pull/01",
    "https://github.com/o/r/pull/1.2",
    "https://github.com/o/r/pull/9007199254740992",
    "https://github.com/o/r/pull/1?url=https://evil.com",
    "https://github.com/o/r/pull/1#diff",
    "https://github.com/o/../pull/1",
    "https://github.com/o/./pull/1",
    "https://github.com/o/%2e%2e/pull/1",
    "https://github.com/o/r\\evil/pull/1",
    "https://github.com/-owner/r/pull/1",
    "https://github.com/owner-/r/pull/1",
    `https://github.com/${"a".repeat(40)}/r/pull/1`,
    `https://github.com/o/${"r".repeat(101)}/pull/1`,
  ])("rejects invalid or unsafe input: %s", (input) => {
    expect(() => parseGitHubPullRequestUrl(input)).toThrow(
      "public GitHub PR URL",
    );
  });
});
