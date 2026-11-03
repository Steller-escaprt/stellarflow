import { describe, it, expect } from 'vitest';

/**
 * Currency and Stroop formatting utilities for Stellar/Soroban tokens.
 */
export function formatStroopsToToken(stroops: bigint, decimals: number = 7): string {
  const isNegative = stroops < 0n;
  const absStroops = isNegative ? -stroops : stroops;
  const divisor = 10n ** BigInt(decimals);
  const integerPart = absStroops / divisor;
  const fractionalPart = absStroops % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
  const prefix = isNegative ? '-' : '';

  if (fractionalStr.length === 0) {
    return `${prefix}${integerPart.toString()}`;
  }
  return `${prefix}${integerPart.toString()}.${fractionalStr}`;
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

describe('Stellar Currency & Stroop Formatting Utilities', () => {
  describe('formatStroopsToToken', () => {
    it('formats exact whole token amounts correctly', () => {
      const tenXLM = 100_000_000n; // 10.0000000
      expect(formatStroopsToToken(tenXLM)).toBe('10');
    });

    it('formats fractional tokens without trailing zeros', () => {
      const fractional = 105_000_000n; // 10.5
      expect(formatStroopsToToken(fractional)).toBe('10.5');
    });

    it('formats small micro-payments with 7 decimals', () => {
      const micro = 1n; // 0.0000001
      expect(formatStroopsToToken(micro)).toBe('0.0000001');
    });

    it('handles zero stroops cleanly', () => {
      expect(formatStroopsToToken(0n)).toBe('0');
    });

    it('handles negative stroops gracefully', () => {
      const neg = -50_000_000n;
      expect(formatStroopsToToken(neg)).toBe('-5');
    });

    it('formats large enterprise balances accurately', () => {
      const oneMillionUSDC = 10_000_000_000_000n;
      expect(formatStroopsToToken(oneMillionUSDC)).toBe('1000000');
    });
  });

  describe('formatCompactCurrency', () => {
    it('formats thousands with K suffix', () => {
      expect(formatCompactCurrency(2500)).toBe('$2.50K');
      expect(formatCompactCurrency(10000)).toBe('$10.00K');
    });

    it('formats millions with M suffix', () => {
      expect(formatCompactCurrency(1500000)).toBe('$1.50M');
      expect(formatCompactCurrency(10000000)).toBe('$10.00M');
    });

    it('formats numbers under 1000 as standard dollar amounts', () => {
      expect(formatCompactCurrency(49.99)).toBe('$49.99');
      expect(formatCompactCurrency(0)).toBe('$0.00');
    });
  });
});
