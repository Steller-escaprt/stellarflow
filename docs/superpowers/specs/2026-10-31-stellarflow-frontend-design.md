# StellarFlow Frontend Architecture & Design Specification

**Date**: 2026-10-31  
**Project**: StellarFlow (`Steller-escaprt/stellarflow`)  
**Scope**: Frontend Rebranding, Modern DeFi Glassmorphic Design System, and Real-Time Stream Lifecycle UX

---

## 1. Executive Summary & Goals

StellarFlow is a high-performance payment streaming platform built on the Stellar network and Soroban smart contracts. This specification establishes the comprehensive frontend overhaul:
1. **Rebranding**: Complete transition from legacy *StellarFlow* naming to **StellarFlow**, including brand typography, logos, navigation, and metadata.
2. **Design System & Visual Language**: Implementation of a modern Web3 glassmorphic design system with deep space dark mode (`#0B0D17`), electric purple/blue gradients (`#3E1BDB` to `#7B61FF`), fine borders, and responsive layouts.
3. **Application Navigation & Shell**: Sticky top glassmorphic navbar with network status indicators, wallet controls, and view switchers.
4. **Real-time Stream Engine**: Sub-second live ticking counter for streaming balances, glowing dynamic progress bars, and dual-view presentation (Cards Grid vs. High-Density Data Table).
5. **Stream Creation Drawer & Wallet Lifecycle**: Slide-over drawer for single and split stream creation with fee estimation, draft autosave, and multi-state Freighter wallet integration.

---

## 2. Design System & Theme Architecture

### 2.1 Color Tokens & Visual Identity

| Token Name | Hex / CSS Value | Semantic Purpose |
| :--- | :--- | :--- |
| `stellar-bg-dark` | `#0B0D17` | Deep space application background |
| `stellar-bg-light` | `#F8FAFC` | Light mode clean slate background |
| `stellar-card-dark` | `rgba(20, 22, 39, 0.72)` | Glassmorphic surface background |
| `stellar-card-border` | `rgba(255, 255, 255, 0.08)` | Subtle border for translucent cards |
| `stellar-primary` | `#7B61FF` | Electric purple brand accent |
| `stellar-secondary` | `#3E1BDB` | Stellar indigo primary gradient anchor |
| `stellar-flow-cyan` | `#00E5FF` | Glowing indicator for live payment flow rate |
| `stellar-success` | `#10B981` | Active stream beacon & confirmation states |
| `stellar-warning` | `#F59E0B` | Paused stream status & warnings |
| `stellar-danger` | `#EF4444` | Cancelled stream status & error states |

### 2.2 Glassmorphism & Micro-animations
- **Backdrop Filters**: `backdrop-filter: blur(14px)` with `-webkit-backdrop-filter: blur(14px)`.
- **Card Hover Elevation**: `border-color: rgba(123, 97, 255, 0.35)` with `box-shadow: 0 8px 32px 0 rgba(123, 97, 255, 0.12)`.
- **Flow Pulse**: Animated CSS pulse badge on active streams signaling second-by-second token vesting.

---

## 3. Component Architecture & Hierarchy

```
App.tsx
├── Navbar.tsx (Sticky Glass Header)
│   ├── Logo & Brand (StellarFlow SVG emblem)
│   ├── NetworkBadge (Testnet / Mainnet)
│   ├── NavTabs (Dashboard, Outgoing, Incoming)
│   ├── NewStreamButton (Drawer Trigger)
│   ├── WalletButton (Freighter connection pill)
│   └── DarkModeToggle
├── SlideOverDrawer (CreateStreamDrawer.tsx)
│   └── CreateStreamForm.tsx (Single & Split mode, Fee Estimate, Cliff)
├── Main Content
│   ├── ToastContainer (Animated glass notifications)
│   ├── OfflineBanner.tsx
│   └── Current View
│       ├── DashboardPage.tsx
│       │   ├── KpiMetricsGrid.tsx (Volume, Active, Velocity, Claimable)
│       │   ├── FilterAndControlsBar.tsx (Search, Status, Asset, ViewToggle)
│       │   ├── StreamMetricsChart.tsx (Recharts vesting curves)
│       │   └── StreamListContainer (Grid vs Table)
│       │       ├── StreamCardGrid.tsx (LiveStreamCard items)
│       │       └── StreamsTable.tsx (Virtualized data table)
│       ├── SenderDashboard.tsx (Outgoing stream management)
│       └── RecipientDashboard.tsx (Incoming streams & ClaimBatchModal)
└── StreamDetailDrawer.tsx (Deep-dive stream timeline & event history)
```

---

## 4. Key Functional Workflows

### 4.1 Real-Time Balance Counter Engine (`useLiveStreamAmount`)
The real-time counter calculates continuous vesting between start and stop timestamps:
$$\text{vested}(t) = \begin{cases} 
0 & t < \text{startAt} \\
0 & t < \text{cliff} \text{ (if cliff configured)} \\
\text{totalAmount} \times \frac{t - \text{startAt}}{\text{stopAt} - \text{startAt}} & \text{startAt} \le t < \text{stopAt} \\
\text{totalAmount} & t \ge \text{stopAt}
\end{cases}$$

- Unclaimed balance available to recipient: $\max(0, \text{vested}(t) - \text{claimedAmount})$.
- Updates on a 100ms interval with 6 decimal places (e.g. `142.849102 USDC`).
- Paused streams freeze the calculation at the pause timestamp until resumed.

### 4.2 Stream Creation Drawer
- Triggered globally by `+ New Stream` in `Navbar.tsx` or empty state actions.
- Multi-step guided inputs:
  1. Recipient Stellar address (checksum validation + clipboard paste).
  2. Asset selection (`USDC`, `XLM`) and total deposit.
  3. Stream duration (1D, 1W, 1M, 3M, Custom) and optional cliff date.
  4. Real-time fee estimation and flow velocity display (`rate/sec`).
- Built-in draft autosave to `localStorage` via `useDraftAutosave`.

### 4.3 Wallet Integration Flow
- Integrated with `@stellar/freighter-api`.
- Supports connection states: `Disconnected`, `Connecting`, `Connected`, `Wrong Network`.
- Truncated address presentation (`GBX...4Q2`) with one-click copy and Stellar Expert block explorer deep-links.

---

## 5. File Modifications & Additions Map

1. **Brand & Rebranding**:
   - `frontend/index.html`: Title, metadata, favicon updated to StellarFlow.
   - `frontend/src/App.tsx`: Brand header, navigation links, and layout shell updated.
   - `frontend/src/components/Navbar.tsx`: New sticky glass navbar component.
2. **Styling & Theme**:
   - `frontend/src/index.css`: Glassmorphic utility classes, responsive grid definitions, dark/light root theme variables.
   - `frontend/tailwind.config.js`: Integrated `stellar` design tokens and glass classes.
3. **Components & Views**:
   - `frontend/src/components/LiveStreamCard.tsx`: Individual stream card with real-time ticker and glowing progress track.
   - `frontend/src/components/CreateStreamDrawer.tsx`: Slide-over drawer container for stream creation.
   - `frontend/src/components/KpiMetricsGrid.tsx`: Modern statistics telemetry cards.
   - `frontend/src/pages/DashboardPage.tsx`: Layout updated to incorporate KPI grid, view toggle, and slide-over drawer integration.

---

## 6. Verification & Quality Gates
- **TypeScript Compilation**: `npm run build` (`tsc && vite build`) must exit with code `0`.
- **Responsive Testing**: Verified across mobile (<640px), tablet (768px), and desktop (1024px+).
- **Accessibility (a11y)**: ARIA labels on all modal and drawer controls, focus traps on slide-over panels, WCAG AA contrast standards.

