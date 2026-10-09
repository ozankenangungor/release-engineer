# Public-PR pilot validation

Prepared **9 October 2026**. This is an executable workflow and a proposed validation plan, **not completed pilot evidence**. It requires real developers, actual observations, permission and manual review. No invitation has been sent on the founder's behalf.

## The question

Does Release Engineer give a maintainer something useful to verify or act on when reviewing a public API or behavior change? Also record what was wrong, already known, missing or impossible to judge. A positive opinion alone is weaker than a pinned finding, the evidence checked and the action taken.

The initial audience is a hypothesis: maintainers and developers working on public libraries, API contracts and behavior changes. Do not claim demand merely because this audience exists.

## A participant's flow

1. Read the [beta guide](https://releaseengineer.tech/pilot) and select a public PR whose change you can check. Avoid leaked secrets or sensitive vulnerability details even in a public repository.
2. Run the actual analysis, inspect coverage and the reviewed head SHA, then download the report. An offline browser stub is not a participant analysis.
3. Check source evidence, intended contracts, affected callers and actual test results yourself. Release Engineer has not executed tests.
4. In **Save & verify**, leave findings as **Not checked** by default. Record Supported / Incorrect / Needs more context only with an explanation of the evidence you checked.
5. Record usefulness, actual follow-through and optional prior use. A rated review or action needs an explanation. A no-findings report can still be unhelpful or miss a concern.
6. Download the verification JSON. Review it and the text report before voluntarily sharing selected material. Neither export uploads notes or automatically sends email.
7. Agree with the founder on private retention and, separately, any publication. The [blank worksheet](../public/verification-worksheet.txt) works without a completed analysis or JavaScript.

Notes exist only in page memory until downloaded. Reloading or receiving a new report clears the page notes. Files saved by the browser persist on the participant's device under their control. The interface revision in an export identifies the page build; it does **not** establish the analysis execution revision, exact system prompt or served model.

## Operator admission and private records

Keep completed files outside the public checkout or in ignored `.private-evidence/`. Keep contact/deduplication mappings separately. Do not upload participant notes, PR reports or contact records to a public issue, PR or repository.

Before admitting a record:

1. Establish how it was obtained and distinguish `external_tester`, `founder_test` and `scripted_check`. Never classify the browser test fixtures or a founder-run session as external evidence.
2. Establish consent to retain it and an agreed retention date. Publication, exact quote and identity permission remain separate.
3. Check the public PR/head reference against the separately retained report, if available. Record unavailable provenance as unknown. A self-recorded JSON file is neither signed model output nor independent proof of authorship.
4. Resolve repeat exports. A page session uses one record ID; edited exports can conflict. Choose the final version, preserve that exact file and hash it. Do not count multiple exports as separate uses.
5. Use a private stable pseudonym based on your actual participant relationship. It is an operator assertion, not proof of a unique person. Several accounts can belong to one person; one account can be shared.
6. Hash the final raw bytes with SHA-256 and place the explicit admission manifest **outside the records directory**.

### Admission manifest shape

**Template only.** Replace every placeholder with checked data; the placeholders intentionally do not constitute valid admissions. Do not prepopulate this from the existing three quotes, logs or a scripted run.

```json
[
  {
    "recordId": "ACTUAL_EXPORTED_UUID",
    "fileSha256": "SHA256_OF_FINAL_FILE_BYTES",
    "observationSource": "external_tester",
    "participantPseudonym": "tester_chosen_by_operator",
    "sourceCheckedByOperator": true,
    "consentToRetain": true,
    "retentionUntil": "AGREED_UTC_ISO_DATE"
  }
]
```

Both booleans are human attestations, not switches that acquire consent or establish a source. If source/consent is unknown, do not admit the record. Remove unnecessary material or resolve the uncertainty. Respect withdrawal and expiry; delete retained copies where appropriate rather than only omitting them from a report.

### Run the actual offline summary

```sh
pnpm pilot:summarize --help
pnpm pilot:summarize /private/pilot-records \
  --admissions /private/admissions.json \
  --from 2026-10-09T00:00:00.000Z \
  --to 2026-10-23T00:00:00.000Z
```

The example dates define a proposed window, not records that exist. The command performs no network requests, loads no environment files and calls no model. It compiles its TypeScript reader into ignored `.pilot-build/`. Run it separately from another invocation of the same command. The reader bounds each file to 1 MB and the folder/manifest to 500 entries, validates strict record schemas, deduplicates identical record IDs/files and fails on conflicting versions, hash mismatch, missing admitted files, duplicate admissions or expired retention. The observation window is UTC record-creation time, including its start and excluding its end; it is not analysis execution time.

External usefulness, finding-assessment and action totals contain only admitted `external_tester` records within the window. Founder and scripted records remain separate. Unadmitted files and out-of-window records are counted as excluded. Summary output contains no notes, PR URLs, record IDs, participant pseudonyms or contact information. Aggregates can still be identifying in a small pilot; publication needs a separate review and appropriate consent.

### What the totals mean

| Output | Permitted interpretation | Interpretation to avoid |
| --- | --- | --- |
| External feedback records | Number of admitted records in the creation-time window | Unique users, completed analyses or customers |
| Distinct participant pseudonyms | Operator-assigned deduplication keys | Independently verified people |
| Records reporting prior use | Self-reported answers in these records | Retention, daily/monthly active users |
| Supported/incorrect/needs context | Participant assessment of findings | Defect precision, recall or independent correctness |
| Reported action | Participant statement about follow-through | Proved code/test change or time saved |
| No findings / no action | Recorded absence in that report | Release safety or absence of defects |

No aggregate is published automatically. A summary cannot transform the Rails founder observation or three approved quotes into a pilot dataset.

## Proposed two-week sequence

These are targets and decision rules. Their existence is not progress against them. Live analyses and evaluations require a separately approved spend limit; no paid call was made to prepare this workflow.

| Days | Target work | Evidence to retain privately |
| --- | --- | --- |
| 1–2 | Personally invite 5–10 relevant developers after founder review of the draft | Permission and source, no automated outreach |
| 3–7 | Collect up to 10 checked public-PR observations, including unhelpful and ambiguous cases | Exact head, report, local record, evidence, missing metadata |
| 8–12 | Ask participants who found value to return on another actual change; target up to 10 further observations | Separate records, same private pseudonym, actual follow-through |
| 13–14 | Human-adjudicate useful/incorrect/inconclusive findings; summarize and review publication consent | Denominators, disagreements, source and limitations |

At the end, choose whether to continue this audience, narrow the contract-risk use case or revise the workflow. If people do not return or findings fail verification, publish/record that result rather than widening the success definition. Do not report a success rate from such a small, selected sample. Two or three well-documented, material, human-checked cases would strengthen the application more than a large count of homepage visits; this is prioritization judgment, not an admission guarantee.

## Follow-through and measurement

Ask what was newly useful, whether it would have been checked anyway, what evidence resolved it, what was wrong and what happened next. When consent allows, link an actual follow-up test or code change to the reviewed head and describe the attribution limits. Do not claim Release Engineer caused an upstream change just because it occurred later.

Measure latency/cost only from a defined measurement and provider/host source. Browser receipt time is not request duration. The historical 32-case candidate reports 88,778 input and 22,150 output tokens with no reported cache tokens; it is a synthetic observation, not a forecast for user PRs. If proposing a budget, use current first-party pricing and the actual intended model, then confirm organization spending limits in the founder's account. Context bytes and per-instance admission do not create a global spending cap.

For model-quality follow-up, preserve the historical originals and keep the dataset/grader stable. First inspect targeted adversarial behavior, then use the established manually controlled evaluation path if the founder approves new paid measurement. A new run needs its exact commit, requested/served model, usage, failures and artifacts; rejected reports and infrastructure failures stay in the denominator. Do not remove difficult cases to achieve a cleaner result.

## Outreach draft — not sent

Hi [name],

I’m building Release Engineer, a Claude-powered second review for public GitHub pull requests. I’m testing whether it helps maintainers check API or behavior changes with clear evidence and limitations. It does not run tests or inspect the full repository.

Would you be willing to try one public PR you can independently verify and tell me what was useful, wrong or missing? The guide is https://releaseengineer.tech/pilot. You can keep your report and notes locally and choose what to share. Participation is voluntary; I will ask separately about retention or any publication. No private code or sensitive vulnerability details are needed.

Thanks,
Ozan

Send only after reviewing the actual recipient/context and obtaining user authorization for external communication. No messages are sent by the application or summary script.
