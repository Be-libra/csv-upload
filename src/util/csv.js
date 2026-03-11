const crypto = require('crypto');
const { parse } = require('csv-parse/sync');

function generateUploadId(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parseCsv(buffer) {
  const text = buffer.toString('utf8');
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  return rows.map((row) => row);
}

module.exports = { generateUploadId, parseCsv };
