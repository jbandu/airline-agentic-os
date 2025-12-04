const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const sql = postgres('postgresql://postgres:fxitFBDbnldbvOnDyTtLZzCvTsCrobSd@nozomi.proxy.rlwy.net:14271/railway');

async function runMigration() {
  try {
    console.log('Connected to Railway PostgreSQL');

    const sqlPath = path.join(__dirname, 'drizzle/0004_spotty_jocasta.sql');
    const migrationSql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying migration 0004...');
    await sql.unsafe(migrationSql);

    console.log('✅ Migration 0004 applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
