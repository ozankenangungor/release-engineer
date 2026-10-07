export type Testimonial = {
  id: string;
  displayName: string;
  role?: string;
  organization?: string;
  quote: string;
  publicPrUrl?: string;
  publicPrLabel?: string;
  attribution: "external-beta" | "external-user";
  permission: "approved";
};

// Only founder-supplied, publication-approved fields belong here.
// Names, aliases, roles and quotes are published as supplied by the founder.
// Publication permission was confirmed; contact details and PR links stay private.
// Consent records and private correspondence stay outside Git.
export const testimonials: readonly Testimonial[] = [
  {
    id: "daniel-reyes",
    displayName: "Daniel Reyes",
    role: "Backend Developer",
    quote:
      "Caught a missing validate=True in my base64 secret decoding right after I wrote the code. The tool doesn't run tests, and it says so — that honesty is why I trust the rest of the report.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "megan-carter",
    displayName: "Megan Carter",
    role: "Full Stack Developer",
    quote:
      "I hadn't noticed my handler changed a 422 to a 400 for malformed JSON. The breaking changes section caught it before merge. Small diff, real contract change.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "tyler-brooks",
    displayName: "Tyler Brooks",
    role: "Open source contributor",
    quote:
      "The fail-open rollout was intentional on my part, but the suggested ALLOW_UNSIGNED_WEBHOOKS flag was a better design than mine. I shipped it in my next PR.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "sarah-lindqvist",
    displayName: "Sarah Lindqvist",
    role: "Staff Engineer",
    quote:
      "Good second perspective on a security change. It flagged the untested edge cases honestly instead of pretending full coverage. Saved me an hour of self-review.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "brandon-mitchell",
    displayName: "Brandon Mitchell",
    role: "SDK Maintainer",
    quote:
      "I maintain a small TypeScript SDK and used it on an API contract change. The report correctly identified which callers were outside the review boundary — that limitation section is the best part.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "emily-foster",
    displayName: "Emily Foster",
    role: "QA Lead",
    quote:
      "The testing gaps list basically became my test plan. Three of the five suggested tests found their way into our suite before merge.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "james-carter",
    displayName: "James Carter",
    role: "DevOps Engineer",
    quote:
      "The recommendation about proxy forwarding raw webhook bodies saved us a confusing production debug session. Would love more explicit debugging guidance though — it took me a moment to connect the dots.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "lauren-hayes",
    displayName: "Lauren Hayes",
    role: "Backend Developer",
    quote:
      "Mixed experience: one finding I already knew, two I hadn't caught. Net useful. The limits being stated up front is what makes the useful findings credible.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "kevin-murphy",
    displayName: "Kevin Murphy",
    role: "Indie hacker",
    quote:
      "First time trying it on my own PR. It read my code better than some human reviewers I've had. Downloaded the report and used it as a checklist.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "marc-dubois",
    displayName: "Marc Dubois",
    role: "Tech Lead",
    quote:
      "We now run Release Engineer on every public PR before assigning a reviewer. It doesn't replace review, but it makes the first pass much faster.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "rachel-sullivan",
    displayName: "Rachel Sullivan",
    role: "API Engineer",
    quote:
      "Found an untested error branch in my webhook signature verification that would have failed closed in production. Caught it in the report, verified in the code, fixed before merge.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "jason-myers",
    displayName: "Jason Myers",
    role: "SaaS founder",
    quote:
      "As a solo founder shipping fast, this is my pre-merge sanity check. It won't catch everything and says so — which is exactly the right amount of trust to give it.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "alex-chen",
    displayName: "Alex Chen",
    role: "Platform Engineer",
    quote:
      "The findings come with file and line references, so verification took minutes instead of a full re-read of the diff. That structure matters more than the AI itself.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "ashley-coleman",
    displayName: "Ashley Coleman",
    role: "Backend Developer",
    quote:
      "One finding was slightly too broad — the risk only applied under a config that we never use. Still, checking it forced me to document that assumption. Better than no review.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "derek-watson",
    displayName: "Derek Watson",
    role: "Open source maintainer",
    quote:
      "Used it on a dependency upgrade PR. Surface-level but useful triage: what changed, what might break, what to test. Exactly what I need for boring-but-risky PRs.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "hannah-weber",
    displayName: "Hannah Weber",
    role: "Senior Developer",
    quote:
      "The reviewed head SHA is pinned in the report, so I know exactly which version the findings apply to. More release tools should do this.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "chris-donovan",
    displayName: "Chris Donovan",
    role: "Full Stack Developer",
    quote:
      "Mixed on one report, clearly useful on the next. When it's useful it's rocket fuel for review. When it's not, the honest limits tell you why. Second one convinced me.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "marcus-johnson",
    displayName: "Marcus Johnson",
    role: "Engineering Manager",
    quote:
      "I don't merge my team's PRs anymore without seeing the Release Engineer report attached. Not because it's always right — because it makes the review conversation concrete.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "madison-reed",
    displayName: "Madison Reed",
    role: "Junior Developer",
    quote:
      "Taught me what to look for in diffs — breaking changes, status code contracts, untested branches. I learned more reviewing its findings than from my last code review cycle.",
    attribution: "external-user",
    permission: "approved",
  },
  {
    id: "nathan-brooks",
    displayName: "Nathan Brooks",
    role: "Backend Developer",
    quote:
      "My second time using it. First report had one wrong finding; second was spot on and the dispositions were clearly separated. The consistency is what will make me a regular user.",
    attribution: "external-user",
    permission: "approved",
  },
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
