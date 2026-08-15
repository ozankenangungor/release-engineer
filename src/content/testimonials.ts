export type Testimonial = {
  id: string;
  displayName: string;
  role?: string;
  organization?: string;
  quote: string;
  publicPrUrl?: string;
  publicPrLabel?: string;
  attribution: "external-beta";
  permission: "approved";
};

// Only founder-supplied, publication-approved fields belong here.
// These display names are approved aliases. PR-link permission was not granted.
// Consent records and private correspondence stay outside Git.
export const testimonials: readonly Testimonial[] = [
  {
    id: "early-beta-tester",
    displayName: "Early Beta Tester",
    role: "Software Engineer",
    quote:
      "Thanks, useful tool. The structured analysis gives a quick sanity check before merging.",
    attribution: "external-beta",
    permission: "approved",
  },
  {
    id: "beta-developer",
    displayName: "Beta Developer",
    role: "Open Source Contributor",
    quote: "It was useful.",
    attribution: "external-beta",
    permission: "approved",
  },
  {
    id: "early-tester",
    displayName: "Early Tester",
    role: "Full-Stack Developer",
    quote:
      "Useful tool to get a structured second perspective on pull requests.",
    attribution: "external-beta",
    permission: "approved",
  },
];
