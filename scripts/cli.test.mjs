import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateVesting, generateLaboratoryUrl, parseArgs, VERSION, PROTOCOL_VERSION } from '../bin/stellarflow.js';

test('StellarFlow CLI: exports correct version metadata', () => {
  assert.equal(VERSION, '1.0.0');
  assert.equal(PROTOCOL_VERSION, '22');
});

test('StellarFlow CLI: calculateVesting computes linear formula correctly', () => {
  const result = calculateVesting(1000, 100, 20, 50);
  assert.equal(result.vested, 500);
  assert.equal(result.unvested, 500);
  assert.equal(result.percent, '50.00');
  assert.equal(result.cliffReached, true);
  assert.equal(result.velocityPerSec, '10.000000');
});

test('StellarFlow CLI: calculateVesting enforces cliff delay', () => {
  const preCliff = calculateVesting(1000, 100, 50, 25);
  assert.equal(preCliff.vested, 0);
  assert.equal(preCliff.unvested, 1000);
  assert.equal(preCliff.cliffReached, false);
});

test('StellarFlow CLI: generateLaboratoryUrl encodes XDR into Stellar Laboratory viewer link', () => {
  const sampleXdr = 'AAAAAgAAAAB6sF3jB8fNqV6F5nLq1R7m9g2h8s7d8f9a8d7s6f5g4h3j2k1l';
  const url = generateLaboratoryUrl(sampleXdr);
  assert.match(url, /^https:\/\/laboratory\.stellar\.org\/#xdr-viewer\?input=/);
  assert.match(url, /&type=TransactionEnvelope$/);
});

test('StellarFlow CLI: parseArgs handles flags and positionals correctly', () => {
  const args = ['calculate', '--total', '5000', '--duration', '86400', '-v'];
  const { positional, flags } = parseArgs(args);
  assert.equal(positional[0], 'calculate');
  assert.equal(flags.total, '5000');
  assert.equal(flags.duration, '86400');
  assert.equal(flags.v, true);
});

test('StellarFlow CLI: executes sep7 pay command with formatted URI and QR code', () => {
  import('node:child_process').then(({ execSync }) => {
    const stdout = execSync('node bin/stellarflow.js sep7 pay --amount 250 --asset USDC', { encoding: 'utf8' });
    assert.match(stdout, /SEP-0007 STELLAR PAYMENT URI GENERATOR/);
    assert.match(stdout, /web\+stellar:pay\?destination=/);
    assert.match(stdout, /amount=250/);
    assert.match(stdout, /asset_code=USDC/);
  });
});

test('StellarFlow CLI: executes events command and formats contract stream logs', () => {
  import('node:child_process').then(({ execSync }) => {
    const stdout = execSync('node bin/stellarflow.js events --limit 3', { encoding: 'utf8' });
    assert.match(stdout, /SOROBAN RPC CONTRACT EVENT STREAMER \(Protocol 22\)/);
    assert.match(stdout, /Stream\.Created/);
    assert.match(stdout, /Stream\.Claimed/);
  });
});

