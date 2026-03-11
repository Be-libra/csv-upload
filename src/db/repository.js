const { query } = require('./client');

async function replaceRecordsForUpload(uploadId, rows) {
  const client = await require('./client').getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM records WHERE upload_id = $1', [uploadId]);
    for (let i = 0; i < rows.length; i++) {
      await client.query(
        `INSERT INTO records (upload_id, row_index, data, updated_at)
         VALUES ($1, $2, $3, NOW())`,
        [uploadId, i, JSON.stringify(rows[i])]
      );
    }
    await client.query('COMMIT');
    return rows.length;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function getAllRecords() {
  const result = await query(
    `SELECT id, upload_id, row_index, data, created_at, updated_at
     FROM records ORDER BY created_at, row_index`
  );
  return result.rows.map((row) => ({
    id: row.id,
    uploadId: row.upload_id,
    rowIndex: row.row_index,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

module.exports = {
  replaceRecordsForUpload,
  getAllRecords,
};
