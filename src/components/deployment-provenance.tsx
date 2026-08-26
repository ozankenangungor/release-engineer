import "server-only";
import { getDeploymentProvenance } from "@/lib/deployment-provenance";

export function DeploymentProvenance() {
  const revision = getDeploymentProvenance({
    sha: process.env.VERCEL_GIT_COMMIT_SHA,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    environment: process.env.VERCEL_ENV,
  });
  if (!revision) return null;
  return (
    <aside
      className="deployment-provenance"
      aria-labelledby="deployment-revision-title"
    >
      <div>
        <h3 id="deployment-revision-title" className="section-kicker">
          {revision.title}
        </h3>
        <code title={revision.sha}>{revision.sha.slice(0, 12)}</code>
        <p>{revision.branchLabel}</p>
      </div>
      <a
        className="text-link"
        href={revision.commitUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Inspect commit <span aria-hidden="true">↗︎</span>
      </a>
    </aside>
  );
}
