const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'drizzle', '0000_old_diamondback.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    await sql.unsafe(migrationSQL);

    console.log('✓ Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
