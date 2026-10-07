# Public PR case-study workflow

**Process and blank template only. No completed case study or external validation is asserted.** Start with one small, public PR; prepare up to three cases only when real observations support them. A case study is a human-adjudicated observation, not a model-quality benchmark.

## Capture and publication gates

1. Choose a public PR whose minimal context can be processed lawfully and safely. Record author/project attribution and redistribution permission; public visibility is not permission to copy arbitrary code. Do not retain leaked secrets, personal data or undisclosed exploit details.
2. Record the source of participation **before** testing: founder test, external tester report, or independently observed external session. A founder running their own or another project's PR is **founder testing**, never external validation. An external author of the PR is not automatically a tester of this product.
3. Pin the PR URL, repository, base/head SHAs and date. Record the head SHA actually displayed in the report, product deployment/commit, model configuration at that commit, prompt fingerprint if available and coverage warnings. A configured default is not proof of the model served on an unknown deployment. Do not infer unavailable metadata.
4. A new real analysis consumes operator credits. Obtain separate authorization for a capped run; do not automate analyses from this template. Preserve the minimum report privately and distinguish reported context from unavailable files, tests and runtime state.
5. Have a human check the finding independently using the pinned patch, a targeted regression test, a documented contract/fix or other identified evidence. Record who adjudicated it, their relationship to the founder and whether they saw the model output. A founder's manual adjudication is not an independent external review. Model agreement, a merge or an author's PR description alone is not confirmation.
6. Record confirmed, suspected, disputed and missed issues, including useful negative observations. Report action taken only when observed. If independent evidence is insufficient, retain a private observation rather than publishing “found a bug.”
7. Obtain explicit permission for retained feedback, anonymized publication, exact quotes and names separately. Follow the [feedback workflow](beta-feedback-template.md). A public PR does not grant permission to disclose a tester's participation or private messages.
8. Review a sanitized draft before publication. Label founder testing prominently, link the pinned source/evidence, disclose limitations and remove sensitive material. Add only publication-approved fields to `src/content/case-studies.ts` after gates pass. Its schema requires matching public PR identity, reviewed SHA, observation date, participation source, surfaced risks, verification with source links, limitations and explicit publication permission. Product commit and actions remain “not recorded” / “not established” when unavailable. The homepage preview and `/case-studies` routes use this content; no CMS is needed. Empty routes return 404 and are omitted from navigation/sitemap.

## Blank private record

- Case ID and observation date/time:
- Participation source (founder / external report / observed external session):
- Private feedback record ID and consent references, if applicable:
- Public PR URL, repository, base SHA and reviewed head SHA:
- Source attribution, license/permission and publication decision:
- Product deployment URL, commit and evidence for that commit:
- Requested/served model and source; prompt/context fingerprints if available:
- Coverage, missing/truncated context and known unavailable evidence:
- Private report reference; retain only what is needed:
- Finding or recommendation surfaced (model assertion, not yet confirmation):
- Human adjudicator, independence/conflicts and method:
- Independent evidence URL/test/contract at a pinned revision:
- Adjudication (confirmed / suspected / disputed / insufficient evidence):
- False positive or missed issue, if observed:
- Developer action and source, or unknown:
- Publication/quote/name permissions and disclosure review:

## Public draft headings, only after review

- **Source and participation:** explicitly founder testing or documented external participation.
- **PR context:** pinned source and the bounded context actually supplied.
- **What Release Engineer surfaced:** a minimal paraphrase without unnecessary source code.
- **Why it mattered:** supported consequence, qualified where uncertain.
- **Independent verification:** evidence and reviewer relationship; no fabricated execution claim.
- **Action taken:** observed action or “not established.”
- **Limitations:** partial context, disputed findings and what was not verified.

Do not publish tester/PR counts or accuracy from a few case studies. The [real-world dataset plan](evaluation-real-world-plan.md) has additional admission/versioning gates for using observations in a labeled evaluation set.
