# Changelog

All notable changes to the StellarFlow Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-03

### Added
- **Core Protocol Engine**: Deployed Soroban smart contracts on Stellar Testnet (`CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74`) supporting continuous token streaming, cliff periods, pausing, canceling with automated unvested refunds, and token claims.
- **Enterprise Bulk Payroll Engine**:
  - `POST /api/streams/batch` endpoint supporting atomic multi-stream initiation.
  - Interactive multi-row Employee Payroll Table in `CreateStreamForm`.
  - CSV file and raw text paste importer for rapid corporate payroll ingestion.
  - 1-click Demo Team loader for instant evaluation and testing.
- **Dynamic Stream Lifecycle Modifications**:
  - `POST /api/streams/:id/topup` for adding capital to existing active streams without interrupting flow.
  - `POST /api/streams/:id/extend` for extending stream end dates with automated flow rate recalculation.
  - Interactive Top-Up and Extension dialog modals in `StreamDetailDrawer`.
- **Payment Verification & Remittance Slips**:
  - `GET /api/streams/:id/receipt` endpoint returning cryptographic remittance records.
  - `StreamReceiptModal` with `@media print` formatted printable invoices, 1-click text copy, flow rates, and on-chain Soroban explorer links.
- **Production Performance & UX**:
  - Vite manual code-splitting optimizing bundle chunks (`@stellar/stellar-sdk`, `recharts`, `react-core`).
  - Reduced `RecipientDashboard` vendor chunk footprint from 557 kB to 16.3 kB.
  - Progressive Web App (PWA) manifest and mobile responsiveness.
- **High-Reliability Backend & Indexing**:
  - Express.js API with SQLite persistence, WAL mode, and database transaction atomicity.
  - Soroban RPC circuit breaker with resilient polling and cursor checkpointing.
  - Idempotent HMAC-SHA256 webhook worker with exponential backoff and dead-letter queue.
  - Rate limiting, Helmet security headers, and CORS allowlisting.
