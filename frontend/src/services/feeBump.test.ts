import { describe, it, expect } from 'vitest';
import {
  simulateFeeBumpEnvelope,
  PROTOCOL_RELAYER_ADDRESS,
} from './feeBump';

describe('CAP-15 Fee-Bump Gas Sponsorship Service', () => {
  const dummyInnerXdr = 'AAAAAgAAAAB6sF3jB8fNqV6F5nLq1R7m9g2h8s7d8f9a8d7s6f5g4h3j2k1l';

  it('generates a sponsored fee-bump transaction envelope', () => {
    const simulation = simulateFeeBumpEnvelope(dummyInnerXdr);
    expect(simulation.gaslessStatus).toBe('sponsored');
    expect(simulation.sponsorAccount).toBe(PROTOCOL_RELAYER_ADDRESS);
    expect(simulation.maxFeeStroops).toBe(200);
    expect(simulation.sponsoredFeeXLM).toBe('0.0000200');
    expect(simulation.feeBumpXdr).toBeDefined();
  });

  it('allows custom sponsor account override', () => {
    const customSponsor = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    const simulation = simulateFeeBumpEnvelope(dummyInnerXdr, customSponsor, 500);
    expect(simulation.sponsorAccount).toBe(customSponsor);
    expect(simulation.maxFeeStroops).toBe(500);
    expect(simulation.sponsoredFeeXLM).toBe('0.0000500');
  });

  it('generates valid Stellar Laboratory inspection URL for fee-bump envelope', () => {
    const simulation = simulateFeeBumpEnvelope(dummyInnerXdr);
    expect(simulation.laboratoryUrl).toContain('https://laboratory.stellar.org/#xdr-viewer?input=');
    expect(simulation.laboratoryUrl).toContain('&type=TransactionEnvelope');
  });
});
