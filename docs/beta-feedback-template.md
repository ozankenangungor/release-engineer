# Private beta feedback template

**Blank template only. No tester record or validation result is asserted here.** Save completed records outside this public checkout or in ignored `.private-evidence/`. Never commit names, email addresses, quotes, raw reports or vulnerability details without an appropriate disclosure review.

## Founder workflow

1. Invite a developer to [try the beta](https://releaseengineer.tech/about#beta) on a public PR and email what was useful, wrong or missing. Do not promise correctness or ask for private code.
2. Ask permission to retain feedback and agree a retention period before creating a retained record. If consent is unknown, resolve it or delete unnecessary material.
3. Complete the fields below using the actual report and tester feedback. Pin the reviewed head SHA, not a later revision. Unknown fields stay unknown.
4. Separate founder observations from external reports. A founder test, synthetic fixture or scripted browser check is **not an external test**.
5. Independently adjudicate suspected false positives/misses; record disagreements and what the developer actually did, if known.
6. Deduplicate repeat sessions using a private stable pseudonym. Do not publish any tester count until consented, deduplicated records exist; define which records qualify and the observation period. Participation is not a customer, active-user or accuracy metric.
7. Obtain separate approval for an anonymized summary, exact quote and identity, then review the exact proposed publication for sensitive content. Never turn an unreviewed email into a public testimonial.

Keep the private deduplication/contact mapping outside Git and collect only what is needed. A public PR can contain leaked secrets or personal information; do not copy those into feedback evidence. Use [SECURITY.md](../SECURITY.md) or the affected project's private disclosure channel.

## Observation

- Record ID:
- Test date/time and timezone:
- Tester pseudonym (not an email/name):
- Source of observation (tester report, directly observed session, or founder test):
- Product deployment URL and commit, if known:
- Public PR URL and repository:
- Retrieved PR head SHA:
- Context coverage/warnings:
- Requested/served model and prompt fingerprint, if known:
- Private report/artifact reference, if retained:

Do not guess unavailable metadata or classify a founder test as external testing. Verify a PR is public and avoid retaining unnecessary source code. A public PR can still contain leaked secrets or personal data; use the relevant disclosure channel instead of storing them in feedback.

## Feedback and adjudication

- Usefulness (useful / not useful / mixed / not assessed), and reason:
- Actionability: which recommendation could be acted on?
- Possible false positive, with supplied evidence:
- Possible missed issue, with independent evidence:
- Human adjudication (confirmed / suspected / disputed / insufficient evidence):
- Action taken, if observed:
- Latency impression (subjective, not measured latency):
- Actual measured timing/token usage and source, if available:
- Follow-up questions:
- Private notes:

Separate opinions from verified defects. “No issue detected” is not proof of safe code. Missing visible tests do not prove that a repository has no tests. Evidence from a later fix, regression test or public advisory should be identified rather than assumed.

## Permission and retention

- Consent to retain this record:
- Agreed retention/review date:
- Consent to publish an anonymized summary:
- Consent to publish an exact quote (exact text and approved context):
- Consent to identify the tester (specific approved identifier):
- Consent source/date and withdrawal contact:
- Publication review status:

Leave consent as unknown unless explicitly granted. Private participation is not publication consent. Keep contact information separately if follow-up is authorized; do not put it in this public template. Define a retention period with the tester and delete unnecessary material.

## Public-evidence checklist

- The observation exists and its source/date can be established.
- Tester report, direct observation and model-generated text are distinguished.
- PR URL/SHA and product version are pinned where available.
- Sensitive information and third-party vulnerability details are removed.
- Publication scope matches explicit consent.
- Any count has a defined denominator/deduplication method; no user/customer/accuracy inference is made from a few feedback records.
- A founder/reviewer has approved the exact public summary.
