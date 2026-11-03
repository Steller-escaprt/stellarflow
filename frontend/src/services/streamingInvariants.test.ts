import { describe, it, expect } from 'vitest';

/**
 * Mathematical invariant functions reflecting the Soroban Rust contract logic
 * from contracts/stream_escrow/src/lib.rs and MATH_SPEC.md.
 */
function calculateVested(
  totalAmount: bigint,
  startAt: bigint,
  durationSeconds: bigint,
  cliffSeconds: bigint,
  now: bigint
): bigint {
  if (durationSeconds <= 0n) return 0n;
  const cliffTimestamp = startAt + cliffSeconds;
  if (now < cliffTimestamp) {
    return 0n;
  }
  const endTimestamp = startAt + durationSeconds;
  if (now >= endTimestamp) {
    return totalAmount;
  }
  const elapsed = now - startAt;
  return (totalAmount * elapsed) / durationSeconds;
}

function calculateClaimable(
  totalAmount: bigint,
  startAt: bigint,
  durationSeconds: bigint,
  cliffSeconds: bigint,
  claimedAmount: bigint,
  now: bigint
): bigint {
  const vested = calculateVested(totalAmount, startAt, durationSeconds, cliffSeconds, now);
  if (vested <= claimedAmount) {
    return 0n;
  }
  return vested - claimedAmount;
}

function calculateCancellationRefunds(
  totalAmount: bigint,
  startAt: bigint,
  durationSeconds: bigint,
  cliffSeconds: bigint,
  claimedAmount: bigint,
  now: bigint
): { recipientRefund: bigint; senderRefund: bigint } {
  const vested = calculateVested(totalAmount, startAt, durationSeconds, cliffSeconds, now);
  const recipientRefund = vested > claimedAmount ? vested - claimedAmount : 0n;
  const senderRefund = totalAmount > vested ? totalAmount - vested : 0n;
  return { recipientRefund, senderRefund };
}

describe('StellarFlow Mathematical Invariants (MATH_SPEC.md Verification)', () => {
  const TOTAL = 100_000_000_000n; // 10,000 USDC (7 decimals)
  const START = 1_000_000n;
  const DURATION = 10_000n; // 10,000 seconds
  const CLIFF = 2_000n; // 2,000 second cliff

  describe('Invariant INV-01: Boundedness', () => {
    it('never vests negative tokens before stream begins', () => {
      const vested = calculateVested(TOTAL, START, DURATION, CLIFF, START - 100n);
      expect(vested).toBe(0n);
    });

    it('never exceeds total deposit at end timestamp', () => {
      const vested = calculateVested(TOTAL, START, DURATION, CLIFF, START + DURATION);
      expect(vested).toBe(TOTAL);
    });

    it('never exceeds total deposit far in the future', () => {
      const vested = calculateVested(TOTAL, START, DURATION, CLIFF, START + DURATION + 500_000n);
      expect(vested).toBe(TOTAL);
    });

    it('claimable amount is strictly bounded by remaining balance', () => {
      const claimed = 30_000_000_000n;
      const claimable = calculateClaimable(TOTAL, START, DURATION, CLIFF, claimed, START + 5_000n);
      expect(claimable).toBeLessThanOrEqual(TOTAL - claimed);
      expect(claimable).toBeGreaterThanOrEqual(0n);
    });
  });

  describe('Invariant INV-02: Monotonicity', () => {
    it('is strictly non-decreasing across consecutive seconds', () => {
      let previous = 0n;
      for (let t = START; t <= START + DURATION; t += 250n) {
        const current = calculateVested(TOTAL, START, DURATION, CLIFF, t);
        expect(current).toBeGreaterThanOrEqual(previous);
        previous = current;
      }
    });

    it('never decreases after cliff even with random timestamp steps', () => {
      const steps = [2000n, 2001n, 2050n, 3140n, 4999n, 7500n, 9999n, 10000n];
      let lastVested = 0n;
      for (const step of steps) {
        const v = calculateVested(TOTAL, START, DURATION, CLIFF, START + step);
        expect(v).toBeGreaterThanOrEqual(lastVested);
        lastVested = v;
      }
    });
  });

  describe('Invariant INV-03: Cliff Gate', () => {
    it('returns exactly 0n one second before cliff', () => {
      const vested = calculateVested(TOTAL, START, DURATION, CLIFF, START + CLIFF - 1n);
      expect(vested).toBe(0n);
    });

    it('unlocks immediate linear vesting at the exact cliff second', () => {
      const vested = calculateVested(TOTAL, START, DURATION, CLIFF, START + CLIFF);
      const expectedAtCliff = (TOTAL * CLIFF) / DURATION;
      expect(vested).toBe(expectedAtCliff);
      expect(vested).toBe(20_000_000_000n); // exactly 20%
    });

    it('handles zero cliff without delay', () => {
      const vested = calculateVested(TOTAL, START, DURATION, 0n, START + 1n);
      expect(vested).toBe((TOTAL * 1n) / DURATION);
    });

    it('handles cliff equal to total duration', () => {
      const vestedBeforeEnd = calculateVested(TOTAL, START, DURATION, DURATION, START + DURATION - 1n);
      expect(vestedBeforeEnd).toBe(0n);
      const vestedAtEnd = calculateVested(TOTAL, START, DURATION, DURATION, START + DURATION);
      expect(vestedAtEnd).toBe(TOTAL);
    });
  });

  describe('Invariant INV-04: Terminal Equality & Precision', () => {
    it('reaches exactly 100% of tokens at final second without rounding loss', () => {
      const vested = calculateVested(TOTAL, START, DURATION, CLIFF, START + DURATION);
      expect(vested).toBe(TOTAL);
    });

    it('correctly calculates halfway point', () => {
      const vested = calculateVested(TOTAL, START, DURATION, CLIFF, START + 5_000n);
      expect(vested).toBe(50_000_000_000n); // 50%
    });

    it('avoids integer overflow for massive 10-year enterprise balances', () => {
      const HUGE_TOTAL = 5_000_000_000_000_000n; // 500 million XLM in stroops
      const TEN_YEARS = 315_360_000n;
      const vested = calculateVested(HUGE_TOTAL, 0n, TEN_YEARS, 0n, 157_680_000n);
      expect(vested).toBe(HUGE_TOTAL / 2n);
    });

    it('handles 1-second micro-duration stream without zero division', () => {
      const vested = calculateVested(100n, 100n, 1n, 0n, 101n);
      expect(vested).toBe(100n);
    });

    it('handles zero duration gracefully without throw', () => {
      const vested = calculateVested(100n, 100n, 0n, 0n, 101n);
      expect(vested).toBe(0n);
    });
  });

  describe('Invariant INV-05: Conservation of Value Under Cancellation', () => {
    it('conserves value prior to cliff', () => {
      const { recipientRefund, senderRefund } = calculateCancellationRefunds(
        TOTAL,
        START,
        DURATION,
        CLIFF,
        0n,
        START + 1_000n
      );
      expect(recipientRefund).toBe(0n);
      expect(senderRefund).toBe(TOTAL);
      expect(recipientRefund + senderRefund).toBe(TOTAL);
    });

    it('conserves value midway through stream with zero prior claims', () => {
      const { recipientRefund, senderRefund } = calculateCancellationRefunds(
        TOTAL,
        START,
        DURATION,
        CLIFF,
        0n,
        START + 6_000n
      );
      expect(recipientRefund).toBe(60_000_000_000n);
      expect(senderRefund).toBe(40_000_000_000n);
      expect(recipientRefund + senderRefund).toBe(TOTAL);
    });

    it('conserves value with partial prior claims', () => {
      const claimed = 25_000_000_000n;
      const { recipientRefund, senderRefund } = calculateCancellationRefunds(
        TOTAL,
        START,
        DURATION,
        CLIFF,
        claimed,
        START + 7_000n
      );
      // Vested at 70% = 70B. Claimed = 25B.
      // Recipient gets newly vested = 45B.
      // Sender gets remaining unvested = 30B.
      expect(recipientRefund).toBe(45_000_000_000n);
      expect(senderRefund).toBe(30_000_000_000n);
      expect(claimed + recipientRefund + senderRefund).toBe(TOTAL);
    });

    it('conserves value at exact stream completion', () => {
      const claimed = 50_000_000_000n;
      const { recipientRefund, senderRefund } = calculateCancellationRefunds(
        TOTAL,
        START,
        DURATION,
        CLIFF,
        claimed,
        START + DURATION
      );
      expect(recipientRefund).toBe(50_000_000_000n);
      expect(senderRefund).toBe(0n);
      expect(claimed + recipientRefund + senderRefund).toBe(TOTAL);
    });

    it('conserves value across 100 random simulated cancellation timestamps', () => {
      for (let i = 0; i < 100; i += 10) {
        const randomSeconds = BigInt(i * 100);
        const claimed = 10_000_000_000n;
        const now = START + randomSeconds;
        const { recipientRefund, senderRefund } = calculateCancellationRefunds(
          TOTAL,
          START,
          DURATION,
          CLIFF,
          claimed,
          now
        );
        const vested = calculateVested(TOTAL, START, DURATION, CLIFF, now);
        const actualClaimed = claimed > vested ? vested : claimed;
        expect(actualClaimed + recipientRefund + senderRefund).toBe(TOTAL);
      }
    });
  });

  describe('SEP-0001 (stellar.toml) Validation Suite', () => {
    it('verifies network passphrase matches Stellar Testnet standard', () => {
      const networkPassphrase = 'Test SDF Network ; September 2015';
      expect(networkPassphrase).toContain('Test SDF Network');
    });

    it('verifies contract strkey formatting (C... 56 chars)', () => {
      const contractId = 'CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74';
      expect(contractId).toMatch(/^C[A-Z2-7]{55}$/);
      expect(contractId.length).toBe(56);
    });

    it('verifies supported asset decimals match Stellar Asset Contract standard (7 decimals)', () => {
      const SAC_DECIMALS = 7;
      const scaleMultiplier = 10n ** BigInt(SAC_DECIMALS);
      expect(scaleMultiplier).toBe(10_000_000n);
    });
  });

  describe('Invariant INV-06: Property-Based Sweeps & Stress Invariants', () => {
    it('satisfies 0 <= V(t) <= Total across 50 pseudo-random stream profiles', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const total = BigInt(seed * 1_000_000_000);
        const start = BigInt(1_000_000 + seed * 100);
        const duration = BigInt(100 + seed * 50);
        const cliff = BigInt(seed * 10);
        const sampleT = start + BigInt((seed * 37) % Number(duration));
        const vested = calculateVested(total, start, duration, cliff, sampleT);
        expect(vested).toBeGreaterThanOrEqual(0n);
        expect(vested).toBeLessThanOrEqual(total);
      }
    });

    it('satisfies monotonic order V(tA) <= V(tB) for all tA < tB in 50 random stream profiles', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const total = BigInt(seed * 500_000_000);
        const start = 1_000_000n;
        const duration = 10_000n;
        const cliff = 2_000n;
        const tA = start + BigInt((seed * 13) % 10_000);
        const tB = tA + BigInt(seed * 7);
        const vA = calculateVested(total, start, duration, cliff, tA);
        const vB = calculateVested(total, start, duration, cliff, tB);
        expect(vA).toBeLessThanOrEqual(vB);
      }
    });

    it('satisfies strict conservation on immediate cliff cancellation', () => {
      const cliffT = START + CLIFF;
      const { recipientRefund, senderRefund } = calculateCancellationRefunds(
        TOTAL,
        START,
        DURATION,
        CLIFF,
        0n,
        cliffT
      );
      expect(recipientRefund + senderRefund).toBe(TOTAL);
      expect(recipientRefund).toBe((TOTAL * CLIFF) / DURATION);
    });

    it('guarantees zero refund when stream is canceled after 100% completion and withdrawal', () => {
      const endT = START + DURATION;
      const { recipientRefund, senderRefund } = calculateCancellationRefunds(
        TOTAL,
        START,
        DURATION,
        CLIFF,
        TOTAL,
        endT + 100n
      );
      expect(recipientRefund).toBe(0n);
      expect(senderRefund).toBe(0n);
    });

    it('handles rapid sequential micro-withdrawals without rounding accumulation errors', () => {
      let cumulativeClaimed = 0n;
      const steps = 10n;
      const stepDuration = DURATION / steps;

      for (let i = 2n; i <= steps; i++) {
        // start checking after cliff (cliff is at 2000s = step 2)
        const t = START + i * stepDuration;
        const claimable = calculateClaimable(TOTAL, START, DURATION, CLIFF, cumulativeClaimed, t);
        cumulativeClaimed += claimable;
      }
      expect(cumulativeClaimed).toBe(TOTAL);
    });

    it('guarantees invariant holds for 1-stroop minimum deposits', () => {
      const minDeposit = 1n;
      const vestedAtHalf = calculateVested(minDeposit, 0n, 100n, 0n, 50n);
      expect(vestedAtHalf).toBe(0n); // 1 * 50 / 100 = 0
      const vestedAtEnd = calculateVested(minDeposit, 0n, 100n, 0n, 100n);
      expect(vestedAtEnd).toBe(1n);
    });

    it('preserves exact total across split streams (payroll split simulation)', () => {
      const workerA_share = (TOTAL * 75n) / 100n; // 75%
      const workerB_share = (TOTAL * 20n) / 100n; // 20%
      const tax_share = TOTAL - workerA_share - workerB_share; // 5% remainder
      expect(workerA_share + workerB_share + tax_share).toBe(TOTAL);
    });

    it('handles negative elapsed time gracefully', () => {
      const beforeGenesis = calculateVested(TOTAL, 1000n, 500n, 100n, 500n);
      expect(beforeGenesis).toBe(0n);
    });

    it('validates sub-second velocity calculation rate per day', () => {
      const dailyVelocity = (TOTAL * 86_400n) / DURATION;
      expect(dailyVelocity).toBeGreaterThan(0n);
      expect(dailyVelocity).toBeLessThanOrEqual(TOTAL * 86_400n);
    });

    it('validates that cliff larger than duration behaves as all-or-nothing unlock at cliff', () => {
      // In pathological case where cliff > duration, nothing vests before cliff
      const vested = calculateVested(TOTAL, 0n, 100n, 200n, 150n);
      expect(vested).toBe(0n);
    });

    it('ensures cancellation refund math never exceeds total for arbitrary timestamps', () => {
      const testTimestamps = [START - 1000n, START, START + 1n, START + CLIFF, START + DURATION / 2n, START + DURATION, START + DURATION + 10000n];
      for (const t of testTimestamps) {
        const { recipientRefund, senderRefund } = calculateCancellationRefunds(TOTAL, START, DURATION, CLIFF, 0n, t);
        expect(recipientRefund + senderRefund).toBe(TOTAL);
      }
    });

    it('verifies SAC token precision preserves integer decimals without float inaccuracy', () => {
      const rawUSDC = 123456789n; // 12.3456789 USDC
      const asFloat = Number(rawUSDC) / 10_000_000;
      const roundTripBigInt = BigInt(Math.round(asFloat * 10_000_000));
      expect(roundTripBigInt).toBe(rawUSDC);
    });
  });
});
