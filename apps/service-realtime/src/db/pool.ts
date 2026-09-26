import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

/**
 * Idempotent schema apply for society_realtime.
 * Tracked versions live in schema_migrations for future incremental scripts.
 */
export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(64) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const version = '001_gate_passes';
  const existing = await pool.query(
    `SELECT 1 FROM schema_migrations WHERE id = $1`,
    [version],
  );
  if ((existing.rowCount ?? 0) > 0) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gate_passes (
      uid UUID PRIMARY KEY,
      society_id UUID NOT NULL,
      flat_id UUID NULL,
      visitor_name VARCHAR(150) NOT NULL,
      visitor_phone VARCHAR(20) NULL,
      purpose VARCHAR(255) NULL,
      created_by_user_id UUID NOT NULL,
      approved_by_user_id UUID NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
      valid_from TIMESTAMPTZ NOT NULL,
      valid_until TIMESTAMPTZ NOT NULL,
      qr_token_hash VARCHAR(128) NULL,
      qr_nonce VARCHAR(64) NULL,
      used_at TIMESTAMPTZ NULL,
      rejected_reason VARCHAR(255) NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_gate_passes_society
      ON gate_passes (society_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gate_passes_status
      ON gate_passes (status);
  `);

  await pool.query(
    `INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [version],
  );
}
