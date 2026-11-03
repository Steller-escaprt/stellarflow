# 🚀 StellarFlow Developer Quickstart Guide

This guide walks you through setting up a local development environment, running the StellarFlow Soroban test suite, and interacting with the continuous payment streaming contract on Stellar Testnet.

---

## 1. Prerequisites

Ensure you have the following installed on your workstation:

- **Node.js**: v18.x or v20.x
- **Rust & Cargo**: v1.79.0+ (`rustup target add wasm32-unknown-unknown`)
- **Stellar CLI**: v22.0.0+ (`cargo install --locked stellar-cli --features opt`)
- **Freighter Wallet Extension**: Configured for **Stellar Testnet**

---

## 2. Repository Setup & Dependencies

```bash
# Clone the repository
git clone https://github.com/Steller-escaprt/stellarflow.git
cd stellarflow

# Install root dependencies
npm install --legacy-peer-deps

# Install frontend dependencies
cd frontend && npm install --legacy-peer-deps && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

---

## 3. Running Smart Contract Unit & Invariant Tests

The Soroban stream escrow contract is located in `contracts/`.

```bash
# Run Rust smart contract unit tests
cd contracts
cargo test

# Build the WASM contract binary
cargo build --target wasm32-unknown-unknown --release
```

---

## 4. Running the Frontend with Retro OS

The frontend runs with Vite and communicates with Stellar Testnet Soroban RPC (`https://soroban-testnet.stellar.org`).

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to launch the **StellarFlow OS** interface:
- Use `/streams` to browse active streaming escrows.
- Use `/vesting` to simulate linear vesting curves and calculate cliff unlock amounts.
- Use `/contract` to inspect deployed contract state and bindings.
- Use `/terminal` to test CLI command execution directly in the browser.

---

## 5. Running Automated Invariant Tests

StellarFlow contains **307 automated unit and property-based tests** verifying mathematical invariants ($V(t)$ monotonicity, conservation of tokens under cancellation, and cliff delays):

```bash
cd frontend
npx vitest run
```

---

## 6. Interacting with the Deployed Testnet Contract

- **Contract ID:** `CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74`
- **Network:** Stellar Testnet (`Test SDF Network ; September 2015`)
- **Explorer:** [Stellar.Expert Testnet Contract](https://stellar.expert/explorer/testnet/contract/CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74)

```bash
# Inspect contract info via Stellar CLI
stellar contract info --id CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74 --network testnet
```
