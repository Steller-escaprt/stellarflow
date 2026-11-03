const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'streams.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

// Ensure allowed assets
db.exec(`
  CREATE TABLE IF NOT EXISTS allowed_assets (
    code TEXT PRIMARY KEY
  );
  INSERT OR IGNORE INTO allowed_assets (code) VALUES ('USDC'), ('XLM'), ('EURC');
`);

const now = Math.floor(Date.now() / 1000);

const sampleStreams = [
  {
    id: "stream-usdc-payroll-101",
    sender: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    recipient: "GCZST5I2F4H4W4JUS2GHYN2O6Y236QJ53C4A3H2Z4K6G7M8N9P0Q1R2S",
    asset_code: "USDC",
    total_amount: 12500,
    duration_seconds: 2592000, // 30 days
    start_at: now - 600000,    // ~7 days ago
    created_at: now - 605000,
    canceled_at: null,
    completed_at: null,
    refunded_amount: null,
    archived_at: null,
    paused_at: null,
    paused_duration: 0,
    cliff_seconds: 0,
    metadata: JSON.stringify({
      title: "Core Protocol Contributor - Q4 Retainer",
      department: "Core Engineering",
      rate: "0.00482 USDC/sec"
    }),
  },
  {
    id: "stream-xlm-grant-202",
    sender: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2A7MRDMKO",
    recipient: "GAQW2EPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2A7MRDMKO",
    asset_code: "XLM",
    total_amount: 45000,
    duration_seconds: 1209600, // 14 days
    start_at: now - 350000,    // ~4 days ago
    created_at: now - 355000,
    canceled_at: null,
    completed_at: null,
    refunded_amount: null,
    archived_at: null,
    paused_at: null,
    paused_duration: 0,
    cliff_seconds: 0,
    metadata: JSON.stringify({
      title: "Stellar Community Fund Pilot Grant",
      category: "Ecosystem Tooling"
    }),
  },
  {
    id: "stream-usdc-treasury-303",
    sender: "GCZST5I2F4H4W4JUS2GHYN2O6Y236QJ53C4A3H2Z4K6G7M8N9P0Q1R2S",
    recipient: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    asset_code: "USDC",
    total_amount: 50000,
    duration_seconds: 604800,  // 7 days (High velocity)
    start_at: now - 150000,    // ~1.7 days ago
    created_at: now - 152000,
    canceled_at: null,
    completed_at: null,
    refunded_amount: null,
    archived_at: null,
    paused_at: null,
    paused_duration: 0,
    cliff_seconds: 0,
    metadata: JSON.stringify({
      title: "DAO Liquidity Deployment Stream",
      vault: "StellarFlow-Yield-Alpha"
    }),
  },
  {
    id: "stream-usdc-security-404",
    sender: "GBS4WDA2D766GIZK4C57FOP6Y6C4F7K32B3S65N6QEQZ5A66V2W4E4E4",
    recipient: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2A7MRDMKO",
    asset_code: "USDC",
    total_amount: 18000,
    duration_seconds: 1814400, // 21 days
    start_at: now - 500000,
    created_at: now - 505000,
    canceled_at: null,
    completed_at: null,
    refunded_amount: null,
    archived_at: null,
    paused_at: now - 86400,    // Paused 1 day ago
    paused_duration: 86400,
    cliff_seconds: 0,
    metadata: JSON.stringify({
      title: "Soroban Formal Verification Audit",
      vendor: "OtterSec Labs"
    }),
  },
  {
    id: "stream-xlm-advisory-505",
    sender: "GAQW2EPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2A7MRDMKO",
    recipient: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    asset_code: "XLM",
    total_amount: 8500,
    duration_seconds: 86400,   // 24 hours
    start_at: now - 250000,
    created_at: now - 252000,
    canceled_at: null,
    completed_at: now - 163600,// Fully completed
    refunded_amount: null,
    archived_at: null,
    paused_at: null,
    paused_duration: 0,
    cliff_seconds: 0,
    metadata: JSON.stringify({
      title: "Architecture Sprint Advisory Milestone"
    }),
  },
  {
    id: "stream-usdc-vesting-606",
    sender: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    recipient: "GBS4WDA2D766GIZK4C57FOP6Y6C4F7K32B3S65N6QEQZ5A66V2W4E4E4",
    asset_code: "USDC",
    total_amount: 75000,
    duration_seconds: 7776000, // 90 days
    start_at: now + 86400,     // Starts tomorrow
    created_at: now - 10000,
    canceled_at: null,
    completed_at: null,
    refunded_amount: null,
    archived_at: null,
    paused_at: null,
    paused_duration: 0,
    cliff_seconds: 0,
    metadata: JSON.stringify({
      title: "Seed Round Token Grant Stream",
      tranche: "Phase-1"
    }),
  },
];

const insertStream = db.prepare(`
  INSERT INTO streams (
    id, sender, recipient, asset_code, total_amount, duration_seconds,
    start_at, created_at, canceled_at, completed_at, refunded_amount,
    archived_at, paused_at, paused_duration, cliff_seconds, metadata
  ) VALUES (
    @id, @sender, @recipient, @asset_code, @total_amount, @duration_seconds,
    @start_at, @created_at, @canceled_at, @completed_at, @refunded_amount,
    @archived_at, @paused_at, @paused_duration, @cliff_seconds, @metadata
  )
  ON CONFLICT(id) DO UPDATE SET
    sender = excluded.sender,
    recipient = excluded.recipient,
    asset_code = excluded.asset_code,
    total_amount = excluded.total_amount,
    duration_seconds = excluded.duration_seconds,
    start_at = excluded.start_at,
    created_at = excluded.created_at,
    canceled_at = excluded.canceled_at,
    completed_at = excluded.completed_at,
    refunded_amount = excluded.refunded_amount,
    archived_at = excluded.archived_at,
    paused_at = excluded.paused_at,
    paused_duration = excluded.paused_duration,
    cliff_seconds = excluded.cliff_seconds,
    metadata = excluded.metadata
`);

const insertEvent = db.prepare(`
  INSERT INTO stream_events (
    stream_id, event_type, ledger_sequence, timestamp, actor, amount, metadata
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?
  )
`);

const tx = db.transaction(() => {
  for (const s of sampleStreams) {
    insertStream.run(s);
    insertEvent.run(s.id, 'created', 1000000, s.created_at, s.sender, s.total_amount, JSON.stringify({ memo: "Seeded stream" }));
  }
});

tx();

console.log(`Successfully seeded ${sampleStreams.length} demo streams into ${dbPath}!`);
const total = db.prepare("SELECT COUNT(*) as count FROM streams").get();
console.log(`Total streams in DB now: ${total.count}`);

