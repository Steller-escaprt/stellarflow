import { describe, it, expect, vi } from 'vitest';
import {
  normalizeContractEvent,
  getSimulatedEvents,
  fetchLiveEvents,
  DEFAULT_CONTRACT_ID,
  type SorobanRawEvent,
} from './eventStreamer';

describe('Soroban Event Streamer Service', () => {
  const sampleRaw: SorobanRawEvent = {
    type: 'contract',
    ledger: 1045230,
    ledgerClosedAt: '2026-11-04T12:00:00Z',
    contractId: DEFAULT_CONTRACT_ID,
    id: 'evt-001',
    pagingToken: 'token-001',
    topic: ['Stream', 'Created'],
    value: {
      stream_id: '42',
      sender: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
      total_amount: '1000.0000000',
    },
  };

  it('normalizes raw contract event into structured StreamEventSummary', () => {
    const summary = normalizeContractEvent(sampleRaw);

    expect(summary.id).toBe('evt-001');
    expect(summary.ledger).toBe(1045230);
    expect(summary.type).toBe('created');
    expect(summary.contractId).toBe(DEFAULT_CONTRACT_ID);
    expect(summary.streamId).toBe('42');
    expect(summary.actor).toBe('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');
    expect(summary.amount).toBe('1000.0000000');
  });

  it('provides deterministic simulated events for offline verification', () => {
    const events = getSimulatedEvents(DEFAULT_CONTRACT_ID, 2);

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('created');
    expect(events[1].type).toBe('claimed');
    expect(events[0].streamId).toBe('101');
  });

  it('fetches and normalizes events from mocked RPC server', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: {
          events: [sampleRaw],
        },
      }),
    });

    const events = await fetchLiveEvents(
      DEFAULT_CONTRACT_ID,
      1000,
      10,
      'https://mock-rpc.stellar.org',
      mockFetch as any,
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    expect(events[0].streamId).toBe('42');
    expect(events[0].type).toBe('created');
  });

  it('gracefully falls back to simulated events if network error occurs', async () => {
    const failingFetch = vi.fn().mockRejectedValue(new Error('Network unreachable'));

    const events = await fetchLiveEvents(
      DEFAULT_CONTRACT_ID,
      1000,
      3,
      'https://broken-rpc.stellar.org',
      failingFetch as any,
    );

    expect(failingFetch).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(3);
    expect(events[0].contractId).toBe(DEFAULT_CONTRACT_ID);
  });
});
