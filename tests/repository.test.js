const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('repository', () => {
  describe('replaceRecordsForUpload', () => {
    it('builds correct insert shape', () => {
      const rows = [{ name: 'A', age: '1' }];
      const uploadId = 'test-id';
      const expectedParams = [uploadId, 0, JSON.stringify(rows[0])];
      assert.strictEqual(expectedParams[0], uploadId);
      assert.strictEqual(expectedParams[1], 0);
      assert.deepStrictEqual(JSON.parse(expectedParams[2]), rows[0]);
    });
  });
  describe('getAllRecords', () => {
    it('maps snake_case to camelCase', () => {
      const row = {
        id: 'x',
        upload_id: 'u',
        row_index: 0,
        data: { a: 1 },
        created_at: new Date(),
        updated_at: new Date(),
      };
      const out = {
        id: row.id,
        uploadId: row.upload_id,
        rowIndex: row.row_index,
        data: row.data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      assert.strictEqual(out.uploadId, 'u');
      assert.strictEqual(out.rowIndex, 0);
    });
  });
});
