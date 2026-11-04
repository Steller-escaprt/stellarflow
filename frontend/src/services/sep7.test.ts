import { describe, it, expect } from 'vitest';
import {
  buildSep7PayUri,
  buildSep7TxUri,
  parseSep7Uri,
  generateQrMatrixUrl,
  STELLAR_TESTNET_PASSPHRASE,
} from './sep7';

describe('SEP-7 Stellar URI Scheme', () => {
  const sampleDestination = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';
  const sampleXdr = 'AAAAAgAAAAA3+71Q...';

  it('builds a valid SEP-7 pay URI with destination and amount', () => {
    const uri = buildSep7PayUri({
      destination: sampleDestination,
      amount: '150.50',
      assetCode: 'USDC',
      memo: 'Stream Deposit #101',
      memoType: 'MEMO_TEXT',
      networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
    });

    expect(uri).toContain('web+stellar:pay?');
    expect(uri).toContain(`destination=${sampleDestination}`);
    expect(uri).toContain('amount=150.50');
    expect(uri).toContain('asset_code=USDC');
    expect(uri).toContain(`memo=${encodeURIComponent('Stream Deposit #101')}`);
    expect(uri).toContain('memo_type=MEMO_TEXT');
    expect(uri).toContain(encodeURIComponent(STELLAR_TESTNET_PASSPHRASE));
  });

  it('throws on invalid destination address for pay URI', () => {
    expect(() =>
      buildSep7PayUri({
        destination: 'invalid-address',
      }),
    ).toThrow('Invalid Stellar destination account ID.');
  });

  it('builds a valid SEP-7 tx URI with base64 XDR', () => {
    const uri = buildSep7TxUri({
      xdr: sampleXdr,
      msg: 'Initialize StellarFlow Vesting Contract',
      networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
    });

    expect(uri).toContain('web+stellar:tx?');
    expect(uri).toContain(`xdr=${encodeURIComponent(sampleXdr)}`);
    expect(uri).toContain(`msg=${encodeURIComponent('Initialize StellarFlow Vesting Contract')}`);
  });

  it('parses valid pay and tx URIs correctly', () => {
    const payUri = `web+stellar:pay?destination=${sampleDestination}&amount=50&asset_code=XLM`;
    const parsedPay = parseSep7Uri(payUri);

    expect(parsedPay.operation).toBe('pay');
    expect(parsedPay.params.destination).toBe(sampleDestination);
    expect(parsedPay.params.amount).toBe('50');
    expect(parsedPay.params.asset_code).toBe('XLM');

    const txUri = `web+stellar:tx?xdr=${encodeURIComponent(sampleXdr)}&msg=Test`;
    const parsedTx = parseSep7Uri(txUri);

    expect(parsedTx.operation).toBe('tx');
    expect(parsedTx.params.xdr).toBe(sampleXdr);
    expect(parsedTx.params.msg).toBe('Test');
  });

  it('throws when parsing malformed or unsupported URIs', () => {
    expect(() => parseSep7Uri('https://example.com')).toThrow(
      'Invalid protocol: expected web+stellar: prefix.',
    );
    expect(() => parseSep7Uri('web+stellar:unknown?foo=bar')).toThrow(
      'Unsupported SEP-7 operation: unknown',
    );
    expect(() => parseSep7Uri('web+stellar:pay?amount=10')).toThrow(
      'SEP-7 pay URI missing mandatory destination parameter.',
    );
    expect(() => parseSep7Uri('web+stellar:tx?msg=Hello')).toThrow(
      'SEP-7 tx URI missing mandatory xdr parameter.',
    );
  });

  it('generates a valid QR matrix URL', () => {
    const uri = `web+stellar:pay?destination=${sampleDestination}`;
    const qrUrl = generateQrMatrixUrl(uri);
    expect(qrUrl).toContain('https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=');
    expect(qrUrl).toContain(encodeURIComponent(uri));
  });
});
