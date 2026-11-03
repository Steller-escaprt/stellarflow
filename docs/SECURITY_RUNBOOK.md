# 🛡️ StellarFlow Security Incident Response & Key Management Runbook

This document defines protocol procedures for incident response, threat containment, private key operational hygiene, and emergency communication for the StellarFlow protocol.

---

## 1. Threat Classification & Response Matrix

| Severity | Criteria | Response Time | Action Procedure |
| :--- | :--- | :---: | :--- |
| **P0 - Critical** | Smart contract vulnerability with active fund drainage risk or unauthorized escrow cancellation | **< 1 hour** | Immediate protocol maintainer war-room, alert published via security advisory, broadcast advisory to RPC relayers |
| **P1 - High** | Indexer state desynchronization, WebSocket downtime, or potential client signature spoofing | **< 4 hours** | Re-sync indexer cursor against Stellar Horizon, deploy hotfix release |
| **P2 - Moderate** | Frontend UI display inaccuracies, minor rounding drift in simulation displays | **< 24 hours** | Issue patch release with accompanying regression tests |
| **P3 - Low** | Typographical errors, minor non-security dependency updates | **Next Sprint** | Standard milestone PR workflow |

---

## 2. Key Management & Operational Hygiene

1. **Deployer Secret Keys:**
   - Contract deployments and WASM installations on Stellar Testnet and Mainnet must NEVER be executed from personal hot wallets.
   - All production deployments must use dedicated hardware signers (Ledger) or multi-sig thresholds.
2. **Environment Variable Scrubbing:**
   - Secret keys (`S...`) must NEVER be committed to Git or bundled into frontend client code.
   - Gitleaks and automated secret scanning are enforced on all PRs via `.github/workflows/`.
3. **Soroban Contract Upgrade Governance:**
   - StellarFlow's core contract is deployed with immutable administrator keys to prevent unauthorized code replacement.
   - Any future upgrades require transparent community multi-sig governance.

---

## 3. Responsible Vulnerability Disclosure

Security researchers who discover potential vulnerabilities are requested to report findings privately:
- **Email:** `contact@stellarflow.finance` / `escaprtyu@gmail.com`
- **PGP Key:** Available upon request.
- **Bounty:** Qualified vulnerabilities reported responsibly are eligible for rewards under our bug bounty program.
