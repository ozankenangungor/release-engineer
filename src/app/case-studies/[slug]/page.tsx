import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedCaseStudies } from "@/content/case-studies";
import { CaseStudyRecord } from "@/components/case-studies";

function findStudy(slug: string) {
  return getPublishedCaseStudies().find((item) => item.slug === slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = findStudy(slug);
  if (!study) notFound();
  return {
    title: `${study.title} — Release Engineer`,
    description: study.summary,
    alternates: { canonical: `/case-studies/${slug}` },
    openGraph: {
      title: `${study.title} — Release Engineer`,
      description: study.summary,
      url: `/case-studies/${slug}`,
    },
  };
}
export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const study = findStudy((await params).slug);
  if (!study) notFound();
  return (
    <main id="main" className="page-shell">
      <h1 className="page-title">Public PR observation.</h1>
      <CaseStudyRecord study={study} />
    </main>
  );
}

export function generateStaticParams() {
  return getPublishedCaseStudies().map((study) => ({ slug: study.slug }));
}
