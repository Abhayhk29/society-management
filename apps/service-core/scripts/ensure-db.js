const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });
  await client.connect();
  const name = process.env.DB_NAME || 'society_core';
  const existing = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [name],
  );
  if (existing.rowCount === 0) {
    await client.query(`CREATE DATABASE "${name.replace(/"/g, '')}"`);
    console.log(`Created database ${name}`);
  } else {
    console.log(`Database ${name} already exists`);
  }
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
