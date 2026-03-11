require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool } = require('./client');

async function applySchema() {
  const sql = fs.readFileSync(path.join(__dirname, '../../schema.sql'), 'utf8');
  await getPool().query(sql);
}

async function ensureSchema() {
  try {
    const result = await getPool().query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'records'"
    );
    if (result.rows.length === 0) {
      await applySchema();
      console.log('Schema applied successfully (records table created).');
    }
  } catch (err) {
    throw new Error(`Schema setup failed: ${err.message}`);
  }
}

if (require.main === module) {
  applySchema()
    .then(() => {
      console.log('Schema applied successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { applySchema, ensureSchema };
