# StellarFlow Frontend Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the frontend from StellarFlow to StellarFlow with a modern DeFi glassmorphic design system, sticky glass navbar, real-time live ticking payment stream counters, slide-over stream creation drawer, and hybrid card/table views.

**Architecture:** Implement modular glassmorphic design tokens in Tailwind and CSS. Encapsulate high-frequency balance vesting calculations in a dedicated `useLiveStreamAmount` hook. Create clean, isolated presentation components (`Navbar`, `LiveStreamCard`, `KpiMetricsGrid`, `CreateStreamDrawer`) that compose cleanly into `DashboardPage.tsx` and `App.tsx`.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, @stellar/freighter-api, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-stellarflow-frontend-design.md`

## Global Constraints

- **Branding**: All user-facing titles, headers, metadata, and logos must display **StellarFlow**.
- **Dark Mode Default**: Default background `#0B0D17` with glassmorphic cards `rgba(20, 22, 39, 0.72)`.
- **Light Mode Support**: Clean slate background `#F8FAFC` toggled via `DarkModeToggle`.
- **Non-breaking APIs**: Must preserve all existing API client methods (`createStream`, `cancelStream`, `pauseStream`, `resumeStream`, `getStreamHistory`) in `services/api.ts`.
- **Build Quality Gate**: `npm run build` (`tsc && vite build`) must pass with code 0 at every stage.

## Review Focus

1. **Vesting calculation precision**: Ensure `useLiveStreamAmount` avoids `NaN` or division by zero when `stopTime <= startTime` or stream hasn't started yet.
2. **High-frequency rendering**: The live counter updates every 100ms; ensure state updates are optimized to avoid re-rendering unrelated parent components.
3. **Draft preservation in slide-over**: Closing and reopening `CreateStreamDrawer` must retain the user's in-progress form inputs via `useDraftAutosave`.
4. **Mobile responsiveness**: Sticky glass navbar and hybrid cards must collapse gracefully on mobile screens (<640px).
5. **Freighter disconnected states**: `WalletButton` must cleanly show disconnected/connecting/connected states without unhandled exceptions when Freighter extension is not installed.

---

### Task 1: Rebranding & Sticky Glass Navbar

**Files:**
- Create: `frontend/src/components/Navbar.tsx`
- Create: `frontend/src/components/Navbar.test.tsx`
- Modify: `frontend/index.html:1-35`
- Modify: `frontend/src/App.tsx:1-90`

**Interfaces:**
- Produces: `NavbarProps { currentTab: string; onTabChange: (tab: string) => void; onOpenCreate: () => void; wallet: FreighterState; theme: string; onToggleTheme: () => void; }`

- [ ] **Step 1: Write the failing test for Navbar component**
```tsx
// frontend/src/components/Navbar.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("renders StellarFlow branding and navigation tabs", () => {
    const onTabChange = vi.fn();
    const onOpenCreate = vi.fn();
    render(
      <Navbar
        currentTab="dashboard"
        onTabChange={onTabChange}
        onOpenCreate={onOpenCreate}
        wallet={{ address: null, isConnected: false, network: "TESTNET", balance: null }}
        theme="dark"
        onToggleTheme={vi.fn()}
      />
    );
    expect(screen.getByText("StellarFlow")).toBeDefined();
    expect(screen.getByText("+ New Stream")).toBeDefined();
    fireEvent.click(screen.getByText("+ New Stream"));
    expect(onOpenCreate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd frontend && npm test src/components/Navbar.test.tsx`
Expected: FAIL with module not found

- [ ] **Step 3: Implement `Navbar.tsx` & update `index.html`**
Implement the sticky glassmorphic navbar with StellarFlow logo, network indicator, center tabs, quick `+ New Stream` action, and wallet pill. Update `frontend/index.html` title to "StellarFlow | Real-Time Payment Streaming on Stellar".

- [ ] **Step 4: Run test to verify it passes**
Run: `cd frontend && npm test src/components/Navbar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/index.html frontend/src/components/Navbar.tsx frontend/src/components/Navbar.test.tsx frontend/src/App.tsx
git commit -m "feat(ui): implement StellarFlow sticky glass navbar and brand updates"
```

---

### Task 2: Glassmorphic Design System Tokens & Base Styles

**Files:**
- Modify: `frontend/tailwind.config.js:1-18`
- Modify: `frontend/src/index.css:1-100`

**Interfaces:**
- Produces: Tailwind utility classes (`bg-stellar-dark`, `bg-stellar-card`, `border-stellar-border`, `glass-card`, `glass-card-hover`, `text-gradient-stellar`).

- [ ] **Step 1: Update Tailwind Config with StellarFlow design tokens**
Add `stellar.dark: '#0B0D17'`, `stellar.card: 'rgba(20, 22, 39, 0.72)'`, `stellar.cyan: '#00E5FF'`, `stellar.purple: '#7B61FF'`, `stellar.indigo: '#3E1BDB'` to `theme.extend.colors`.

- [ ] **Step 2: Add glassmorphism utilities to `index.css`**
Add `.glass-card`, `.glass-navbar`, `.glass-input`, and gradient utilities with `backdrop-filter: blur(14px)`.

- [ ] **Step 3: Verify build compiles with updated styles**
Run: `cd frontend && npm run build`
Expected: PASS with code 0

- [ ] **Step 4: Commit**
```bash
git add frontend/tailwind.config.js frontend/src/index.css
git commit -m "style: configure StellarFlow glassmorphic design system tokens and utilities"
```

---

### Task 3: Real-Time Stream Balance Counter Engine

**Files:**
- Create: `frontend/src/hooks/useLiveStreamAmount.ts`
- Create: `frontend/src/hooks/useLiveStreamAmount.test.ts`

**Interfaces:**
- Produces: `useLiveStreamAmount(stream: Stream): { streamedAmount: number; streamedFormatted: string; percentComplete: number; isCliffActive: boolean; status: string }`

- [ ] **Step 1: Write the failing test for `useLiveStreamAmount`**
```ts
// frontend/src/hooks/useLiveStreamAmount.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLiveStreamAmount } from "./useLiveStreamAmount";
import { Stream } from "../types/stream";

describe("useLiveStreamAmount", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates continuous vesting accurately over time", () => {
    const now = 1000000;
    vi.setSystemTime(now * 1000);

    const mockStream: Stream = {
      id: "stream-1",
      sender: "GAAA",
      recipient: "GBBB",
      totalAmount: "1000",
      claimedAmount: "0",
      assetCode: "USDC",
      assetIssuer: null,
      startTime: now,
      stopTime: now + 1000,
      cliff: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
      contractId: null,
      ledgerSequence: 1,
    };

    const { result } = renderHook(() => useLiveStreamAmount(mockStream));
    expect(result.current.streamedAmount).toBe(0);

    // Fast-forward 500 seconds (50% through duration)
    act(() => {
      vi.advanceTimersByTime(500 * 1000);
    });

    expect(result.current.streamedAmount).toBeCloseTo(500, 1);
    expect(result.current.percentComplete).toBeCloseTo(50, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd frontend && npm test src/hooks/useLiveStreamAmount.test.ts`
Expected: FAIL with module not found

- [ ] **Step 3: Implement `useLiveStreamAmount.ts`**
Implement the hook with 100ms ticker interval, handling cliff conditions, paused state, and zero division guard.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd frontend && npm test src/hooks/useLiveStreamAmount.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/src/hooks/useLiveStreamAmount.ts frontend/src/hooks/useLiveStreamAmount.test.ts
git commit -m "feat(core): implement high-precision real-time payment vesting calculation engine"
```

---

### Task 4: Live Stream Card Component

**Files:**
- Create: `frontend/src/components/LiveStreamCard.tsx`
- Create: `frontend/src/components/LiveStreamCard.test.tsx`

**Interfaces:**
- Consumes: `useLiveStreamAmount` from Task 3
- Produces: `LiveStreamCardProps { stream: Stream; onOpenDetail: (id: string) => void; onCancel: (id: string) => Promise<void>; onPause: (id: string) => Promise<void>; onResume: (id: string) => Promise<void>; currentAddress?: string | null; }`

- [ ] **Step 1: Write the failing test for `LiveStreamCard`**
```tsx
// frontend/src/components/LiveStreamCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LiveStreamCard } from "./LiveStreamCard";
import { Stream } from "../types/stream";

describe("LiveStreamCard", () => {
  it("renders stream details, live balance, and asset code", () => {
    const stream: Stream = {
      id: "stream-xyz",
      sender: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      recipient: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      totalAmount: "250.00",
      claimedAmount: "50.00",
      assetCode: "USDC",
      assetIssuer: null,
      startTime: Math.floor(Date.now() / 1000) - 3600,
      stopTime: Math.floor(Date.now() / 1000) + 3600,
      cliff: null,
      status: "active",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
      contractId: null,
      ledgerSequence: 1,
    };

    render(
      <LiveStreamCard
        stream={stream}
        onOpenDetail={vi.fn()}
        onCancel={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
      />
    );
    expect(screen.getByText("USDC")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd frontend && npm test src/components/LiveStreamCard.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `LiveStreamCard.tsx`**
Build the glassmorphic stream card with dynamic live ticker, animated progress track, avatar icons, and action buttons.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd frontend && npm test src/components/LiveStreamCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/LiveStreamCard.tsx frontend/src/components/LiveStreamCard.test.tsx
git commit -m "feat(ui): implement LiveStreamCard component with real-time stream balance ticker"
```

---

### Task 5: Slide-Over Stream Creation Drawer

**Files:**
- Create: `frontend/src/components/CreateStreamDrawer.tsx`
- Create: `frontend/src/components/CreateStreamDrawer.test.tsx`
- Modify: `frontend/src/components/CreateStreamForm.tsx:1-963`

**Interfaces:**
- Produces: `CreateStreamDrawerProps { isOpen: boolean; onClose: () => void; onCreate: (payload: CreateStreamPayload) => Promise<void>; onCreateSplit?: (payload: CreateSplitStreamPayload) => Promise<void>; walletAddress?: string | null; }`

- [ ] **Step 1: Write the failing test for `CreateStreamDrawer`**
```tsx
// frontend/src/components/CreateStreamDrawer.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CreateStreamDrawer } from "./CreateStreamDrawer";

describe("CreateStreamDrawer", () => {
  it("renders when open and handles close action", () => {
    const onClose = vi.fn();
    render(
      <CreateStreamDrawer
        isOpen={true}
        onClose={onClose}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText("Create Payment Stream")).toBeDefined();
    const closeBtn = screen.getByLabelText("Close drawer");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd frontend && npm test src/components/CreateStreamDrawer.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `CreateStreamDrawer.tsx`**
Build slide-over drawer with backdrop blur, smooth slide-in transition, focus trap, escape key closing, and seamless integration with `CreateStreamForm`.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd frontend && npm test src/components/CreateStreamDrawer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/CreateStreamDrawer.tsx frontend/src/components/CreateStreamDrawer.test.tsx frontend/src/components/CreateStreamForm.tsx
git commit -m "feat(ui): implement slide-over stream creation drawer with glassmorphism backdrop"
```

---

### Task 6: Dashboard Page Modernization & View Integration

**Files:**
- Create: `frontend/src/components/KpiMetricsGrid.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx:1-383`
- Modify: `frontend/src/App.tsx:1-122`

**Interfaces:**
- Consumes: `Navbar`, `LiveStreamCard`, `CreateStreamDrawer`, `KpiMetricsGrid`
- Produces: Complete unified dashboard with KPI telemetry, view toggle (`Grid` vs `Table`), and full drawer interaction.

- [ ] **Step 1: Implement `KpiMetricsGrid.tsx`**
Build glassmorphic metrics cards computing: Total Streamed Volume, Active Streams, Aggregate Velocity (`USDC/hr` or `XLM/sec`), and Claimable Balance.

- [ ] **Step 2: Update `DashboardPage.tsx` with View Toggle & Stream Cards**
Add state `[viewMode, setViewMode] = useState<"grid" | "table">("grid")`.
Render `KpiMetricsGrid` at top.
Render `LiveStreamCard` grid when `viewMode === "grid"` and `StreamsTable` when `viewMode === "table"`.
Connect `isCreateDrawerOpen` triggered from navbar or empty states.

- [ ] **Step 3: Update `App.tsx` layout**
Integrate `Navbar.tsx` seamlessly with router tabs and wallet state.

- [ ] **Step 4: Verify test suite and build**
Run: `cd frontend && npm run build`
Expected: PASS with code 0

- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/KpiMetricsGrid.tsx frontend/src/pages/DashboardPage.tsx frontend/src/App.tsx
git commit -m "feat(dashboard): integrate KPI telemetry, hybrid grid/table view, and drawer workflow"
```

---

### Task 7: End-to-End Build & Functional Verification

**Files:**
- Verify: Full repository build from root

- [ ] **Step 1: Run root build**
Run: `npm run build`
Expected: PASS for both backend and frontend

- [ ] **Step 2: Verify live local endpoints**
Check `http://localhost:3000` responds 200 OK and backend `http://localhost:3001/api/health` responds ok.

- [ ] **Step 3: Push completed changes to GitHub**
```bash
git push origin main
```

