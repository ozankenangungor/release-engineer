const repository = "https://github.com/ozankenangungor/release-engineer";

export function getDeploymentProvenance({
  sha,
  branch,
  environment,
}: {
  sha?: string;
  branch?: string;
  environment?: string;
}) {
  if (!sha || sha.length !== 40 || !/^[a-f0-9]{40}$/i.test(sha)) return null;
  const revision = sha.toLowerCase();
  return {
    sha: revision,
    commitUrl: `${repository}/commit/${revision}`,
    title:
      environment === "production"
        ? "Current production revision"
        : environment === "preview"
          ? "Current preview revision"
          : "Current build revision",
    branchLabel:
      environment === "production" && branch === "main"
        ? "Deployed from main"
        : branch
          ? `Source branch: ${branch}`
          : "Source branch not supplied",
  };
}
