/**
 * SEP-0007: Stellar URI Scheme Implementation
 *
 * Implements standard Stellar protocol URIs (web+stellar:) for seamless
 * transaction signing and payment dispatch across desktop and mobile wallets
 * (e.g. Freighter, LOBSTR, Vibrant).
 *
 * Reference: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md
 */

export interface Sep7PayParams {
  destination: string;
  amount?: string | number;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';
  callback?: string;
  msg?: string;
  networkPassphrase?: string;
}

export interface Sep7TxParams {
  xdr: string;
  callback?: string;
  pubkey?: string;
  msg?: string;
  networkPassphrase?: string;
}

export interface ParsedSep7Uri {
  operation: 'pay' | 'tx';
  params: Record<string, string>;
  rawUri: string;
}

export const STELLAR_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export const STELLAR_PUBLIC_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

/**
 * Builds a valid SEP-7 pay URI (web+stellar:pay?...)
 */
export function buildSep7PayUri(params: Sep7PayParams): string {
  if (!params.destination || !params.destination.startsWith('G') || params.destination.length !== 56) {
    throw new Error('Invalid Stellar destination account ID.');
  }

  const queryParts: string[] = [`destination=${encodeURIComponent(params.destination)}`];

  if (params.amount !== undefined && params.amount !== '') {
    const num = Number(params.amount);
    if (isNaN(num) || num <= 0) {
      throw new Error('Amount must be a positive number.');
    }
    queryParts.push(`amount=${encodeURIComponent(params.amount.toString())}`);
  }

  if (params.assetCode) {
    queryParts.push(`asset_code=${encodeURIComponent(params.assetCode.toUpperCase())}`);
  }

  if (params.assetIssuer) {
    queryParts.push(`asset_issuer=${encodeURIComponent(params.assetIssuer)}`);
  }

  if (params.memo) {
    queryParts.push(`memo=${encodeURIComponent(params.memo)}`);
    if (params.memoType) {
      queryParts.push(`memo_type=${encodeURIComponent(params.memoType)}`);
    }
  }

  if (params.msg) {
    queryParts.push(`msg=${encodeURIComponent(params.msg)}`);
  }

  if (params.networkPassphrase) {
    queryParts.push(`network_passphrase=${encodeURIComponent(params.networkPassphrase)}`);
  }

  if (params.callback) {
    queryParts.push(`callback=${encodeURIComponent(params.callback)}`);
  }

  return `web+stellar:pay?${queryParts.join('&')}`;
}

/**
 * Builds a valid SEP-7 tx URI (web+stellar:tx?xdr=...)
 */
export function buildSep7TxUri(params: Sep7TxParams): string {
  if (!params.xdr || typeof params.xdr !== 'string') {
    throw new Error('Transaction XDR string is required.');
  }

  const queryParts: string[] = [`xdr=${encodeURIComponent(params.xdr)}`];

  if (params.pubkey) {
    queryParts.push(`pubkey=${encodeURIComponent(params.pubkey)}`);
  }

  if (params.msg) {
    queryParts.push(`msg=${encodeURIComponent(params.msg)}`);
  }

  if (params.networkPassphrase) {
    queryParts.push(`network_passphrase=${encodeURIComponent(params.networkPassphrase)}`);
  }

  if (params.callback) {
    queryParts.push(`callback=${encodeURIComponent(params.callback)}`);
  }

  return `web+stellar:tx?${queryParts.join('&')}`;
}

/**
 * Parses and validates an incoming SEP-7 URI.
 */
export function parseSep7Uri(uri: string): ParsedSep7Uri {
  if (!uri.startsWith('web+stellar:')) {
    throw new Error('Invalid protocol: expected web+stellar: prefix.');
  }

  const stripped = uri.replace('web+stellar:', '');
  const [operationPart, queryString] = stripped.split('?');

  if (operationPart !== 'pay' && operationPart !== 'tx') {
    throw new Error(`Unsupported SEP-7 operation: ${operationPart}`);
  }

  const params: Record<string, string> = {};
  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  if (operationPart === 'pay' && !params.destination) {
    throw new Error('SEP-7 pay URI missing mandatory destination parameter.');
  }

  if (operationPart === 'tx' && !params.xdr) {
    throw new Error('SEP-7 tx URI missing mandatory xdr parameter.');
  }

  return {
    operation: operationPart,
    params,
    rawUri: uri,
  };
}

/**
 * Generates an SVG/PNG-renderable QR code data link or embed URI for mobile scanning.
 */
export function generateQrMatrixUrl(uri: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(uri)}`;
}
