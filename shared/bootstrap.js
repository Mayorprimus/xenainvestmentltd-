import 'dotenv/config';
import pg from 'pg';

// ---------------------------------------------------------------------------
// PostgreSQL document-store bootstrap.
//
// The whole XENA state is persisted as a single JSONB row in `kv_store` under
// the key 'state'. That keeps the server's existing in-memory document model
// intact (all routes already operate on the `db` object) while making every
// signup, login, balance, payment and admin change durable across restarts on
// Railway's managed PostgreSQL.
// ---------------------------------------------------------------------------

const SCHEMA = `
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

export function makePool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return new pg.Pool({
    connectionString,
    max: 5,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

export async function loadDocument(pool) {
  const { rows } = await pool.query(`SELECT value FROM kv_store WHERE key = 'state'`);
  return rows.length ? rows[0].value : null;
}

export async function saveDocument(pool, doc) {
  await pool.query(
    `INSERT INTO kv_store (key, value, updated_at) VALUES ('state', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(doc)]
  );
}

// Creates the table and seeds the initial document only when the store is
// empty. Safe to run on every boot and from `npm run db:init`.
export async function bootstrapDatabase(pool) {
  await pool.query(SCHEMA);
  const existing = await loadDocument(pool);
  if (existing !== null) return { seeded: false };
  const { buildSeedDocument } = await import('./seed-state.js');
  await saveDocument(pool, buildSeedDocument());
  return { seeded: true };
}