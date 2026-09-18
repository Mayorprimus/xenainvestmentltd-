import 'dotenv/config';
import { makePool, bootstrapDatabase, loadDocument } from '../shared/bootstrap.js';

// One-time / idempotent PostgreSQL setup for Railway:
//   npm run db:init
// Creates the kv_store table and seeds the initial XENA document if empty.

async function main() {
  const pool = makePool();
  if (!pool) {
    // No DATABASE_URL configured yet — the server already provides a JSON-file
    // fallback (data/db.json) for local or temporary testing. Skip gracefully
    // so container start commands (`init-db && server`) don't block startup.
    console.log(
      'DATABASE_URL is not set — skipping PostgreSQL setup. ' +
        'Server will use the JSON file fallback (data/db.json). ' +
        'Add DATABASE_URL (Railway PostgreSQL service) and rerun to persist in Postgres.'
    );
    return;
  }
  try {
    const { seeded } = await bootstrapDatabase(pool);
    const doc = await loadDocument(pool);
    if (seeded) console.log('Database initialized and seeded.');
    else console.log('Database already initialized — seed left untouched.');
    console.log('Document keys:', Object.keys(doc || {}).join(', '));
    console.log('Registered accounts:', (doc?.accounts || []).length);
    console.log('Default admin:', 'admin12345@gmail.com / admin12345');
    console.log('Showcase user:', 'alex.morgan@xena.fi / xena-user-demo');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();