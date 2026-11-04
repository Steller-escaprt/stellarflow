import { describe, it, expect } from 'vitest';
import {
  simulateStreamFootprint,
  generateLaboratoryUrl,
  SOROBAN_LIMITS,
} from './simulation';

describe('Soroban Resource Metering & Simulation Service', () => {
  it('calculates deterministic CPU and memory footprint for create_stream', () => {
    const footprint = simulateStreamFootprint('create_stream');
    expect(footprint.operation).toBe('create_stream');
    expect(footprint.cpuInstructions).toBeGreaterThan(0);
    expect(footprint.cpuInstructions).toBeLessThan(SOROBAN_LIMITS.MAX_CPU_INSTRUCTIONS);
    expect(footprint.memoryBytes).toBeGreaterThan(0);
    expect(footprint.memoryBytes).toBeLessThan(SOROBAN_LIMITS.MAX_MEMORY_BYTES);
    expect(footprint.resourceFeeStroops).toBe(150);
  });

  it('calculates lower resource consumption for claim operation', () => {
    const claimFootprint = simulateStreamFootprint('claim');
    const createFootprint = simulateStreamFootprint('create_stream');
    expect(claimFootprint.cpuInstructions).toBeLessThan(createFootprint.cpuInstructions);
    expect(claimFootprint.memoryBytes).toBeLessThan(createFootprint.memoryBytes);
  });

  it('scales CPU and memory footprints with batch stream count', () => {
    const single = simulateStreamFootprint('batch_create', 1);
    const triple = simulateStreamFootprint('batch_create', 3);
    expect(triple.cpuInstructions).toBeGreaterThan(single.cpuInstructions);
    expect(triple.memoryBytes).toBeGreaterThan(single.memoryBytes);
    expect(triple.resourceFeeStroops).toBeGreaterThan(single.resourceFeeStroops);
  });

  it('generates valid Stellar Laboratory inspection URLs', () => {
    const sampleXdr = 'AAAAAgAAAAB6sF3jB8fNqV6F5nLq1R7m9g2h8s7d8f9a8d7s6f5g4h3j2k1l';
    const url = generateLaboratoryUrl(sampleXdr);
    expect(url).toContain('https://laboratory.stellar.org/#xdr-viewer?input=');
    expect(url).toContain('&type=TransactionEnvelope');
  });

  it('converts Stroops to accurate 7-decimal XLM fee string', () => {
    const footprint = simulateStreamFootprint('create_stream');
    expect(footprint.minResourceFeeXLM).toBe('0.0000150');
  });
});

