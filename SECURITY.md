# Security Policy

## Supported Versions

The following versions of StellarFlow are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of StellarFlow seriously. If you believe you have found a security vulnerability, please report it privately.

**Please do not open a public issue for security vulnerabilities.**

### Private Reporting Process

Please use the **[GitHub Security Advisory](https://github.com/Steller-escaprt/stellarflow/security/advisories/new)** form to report vulnerabilities privately. 

This is the preferred method as it allows us to communicate with you privately and coordinate a fix before public disclosure.

### Our Commitment (SLA)

Once a report is received through the GitHub Security Advisory form, we commit to the following response timeline:

- **48 hours**: Acknowledgement of receipt of the report.
- **7 days**: Initial assessment and confirmation of the vulnerability.
- **30 days**: Target for providing a fix or public disclosure (depending on complexity).

## Security Audits & Invariants

| Invariant / Check | Severity | Mitigation & Verification | Status |
| ----------------- | -------- | ------------------------- | ------ |
| Escrow Solvency   | Critical | On-chain balance `>=` sum of unvested + unclaimed balances | Verified |
| Reentrancy        | High     | Checks-Effects-Interactions & Soroban reentrancy guards | Enforced |
| Access Control    | High     | Stream sender authorization required for pause/cancel/extend/top-up; recipient only for claim | Enforced |
| Integer Overflow  | High     | Rust checked 128-bit arithmetic (`i128`), saturating math | Enforced |
| Replay Attacks    | High     | Stellar transaction sequence numbers and Soroban ledger sequencing | Enforced |
| Webhook Security  | Medium   | HMAC-SHA256 signature headers with unique idempotency keys | Enforced |
