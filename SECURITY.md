# Security Policy

Release Engineer is an early-stage developer tool. Security reports are welcome, and responsible disclosure helps protect the application and its users.

## Reporting a vulnerability

Please report suspected security vulnerabilities privately to:

**founder@releaseengineer.tech**

Do **not** publish a suspected vulnerability in a public GitHub issue or pull request before giving us a reasonable opportunity to investigate and address it.

A useful report includes, when available:

- A concise description of the issue and its security impact.
- Reproduction steps or a minimal proof of concept.
- The affected URL, route, commit, or component.
- Relevant request/response details with secrets and personal data removed.
- Any suggested mitigation, if you have one.

We do not promise a fixed response or remediation timeline. We will assess reports based on severity and available evidence.

## Supported scope

This policy covers security vulnerabilities in:

- The public Release Engineer application at `https://releaseengineer.tech`.
- The Release Engineer source code in this repository.
- Release Engineer's own deployment and request-handling behavior.

This policy does **not** make Release Engineer the security contact for GitHub, Anthropic, Vercel, or third-party repositories analyzed by the product. Please use the relevant vendor or project disclosure process for vulnerabilities in those systems.

## Product-specific boundaries

Release Engineer currently accepts **public GitHub pull-request URLs**. Do not submit private source code, credentials, API keys, access tokens, secrets, or sensitive personal information to the public product.

Release Engineer does not intentionally persist submitted pull-request contents or generated reports in an application database. Requests may still be processed by GitHub, Anthropic, and the hosting provider as described by their applicable policies and terms.

The product is a release-readiness decision-support tool, not a security guarantee. Findings should be verified by maintainers and developers using their own testing and security processes.

## Responsible disclosure for analyzed repositories

If Release Engineer identifies a potential vulnerability in a third-party open-source project, please report it to that project's maintainers using their documented security policy. Do not use Release Engineer's public issue tracker to disclose sensitive exploit details for another project.

Thank you for helping keep Release Engineer and its users secure.
