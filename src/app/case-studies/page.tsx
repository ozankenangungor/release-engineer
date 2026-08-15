import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedCaseStudies } from "@/content/case-studies";
import { CaseStudyRecord } from "@/components/case-studies";

export const metadata: Metadata = {
  title: "Public PR observations — Release Engineer",
  alternates: { canonical: "/case-studies" },
  openGraph: {
    title: "Public PR observations — Release Engineer",
    url: "/case-studies",
  },
};

export default function CaseStudies() {
  const studies = getPublishedCaseStudies();
  if (!studies.length) notFound();
  return (
    <main id="main" className="page-shell">
      <p className="section-kicker">EVIDENCE / PUBLIC PR OBSERVATIONS</p>
      <h1 className="page-title">Public PR observations.</h1>
      <p className="page-intro">
        Pinned change context, human checks and explicit limits. Each
        observation identifies whether participation came from an external
        tester or the founder.
      </p>
      <div className="space-y-8">
        {studies.map((study) => (
          <CaseStudyRecord key={study.slug} study={study} />
        ))}
      </div>
    </main>
  );
}
