export type PullRequestReference = {
  owner: string;
  repository: string;
  number: number;
  url: string;
};

export const PR_URL_ERROR =
  "Enter a public GitHub PR URL: https://github.com/owner/repository/pull/123";

export function parseGitHubPullRequestUrl(input: string): PullRequestReference {
  const match =
    /^https:\/\/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\/([a-zA-Z0-9_.-]{1,100})\/pull\/([1-9]\d*)\/?$/.exec(
      input.trim(),
    );
  if (!match) throw new Error(PR_URL_ERROR);
  const [, owner, repository, numberText] = match;
  const number = Number(numberText);
  if (
    !owner ||
    !repository ||
    repository === "." ||
    repository === ".." ||
    !Number.isSafeInteger(number)
  ) {
    throw new Error(PR_URL_ERROR);
  }
  return {
    owner,
    repository,
    number,
    url: `https://github.com/${owner}/${repository}/pull/${number}`,
  };
}
