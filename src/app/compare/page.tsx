import type { Metadata } from "next";
import Link from "next/link";
import { RevisionComparison } from "@/components/revision-comparison";
import "../product-growth.css";
export const metadata: Metadata = { title: "Compare PR reviews — Release Engineer", description: "Compare two exported reviews of the same public GitHub PR locally, with pinned revisions and explicit verification boundaries.", alternates: { canonical: "/compare" } };
export default function Compare() {
  return <main id="main" className="page-shell comparison-page"><div className="growth-heading"><p className="section-kicker">RELEASE ENGINEER / REVISION COMPARE</p><h1 className="page-title">Keep the review<br /><span>moving forward.</span></h1><p className="page-intro">You changed the code. Compare the next review with the earlier one, then decide what still needs checking.</p><Link className="text-link" href="/#analyze">Analyze a public PR ↗︎</Link></div><RevisionComparison /></main>;
}
