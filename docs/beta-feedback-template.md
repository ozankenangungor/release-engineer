# Private beta feedback template

**Blank template only. No tester record or validation result is asserted here.** Save completed records outside this public checkout or in ignored `.private-evidence/`. Never commit names, email addresses, quotes, raw reports or vulnerability details without an appropriate disclosure review.

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
