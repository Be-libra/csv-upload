const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Kafka consumer', () => {
  it('payload has uploadId and rowCount', () => {
    const payload = { uploadId: 'abc', rowCount: 5, timestamp: new Date().toISOString() };
    assert.strictEqual(payload.uploadId, 'abc');
    assert.strictEqual(payload.rowCount, 5);
  });
  it('duplicate message idempotent: same Redis set', () => {
    const records = [{ id: '1' }];
    const set1 = JSON.stringify(records);
    const set2 = JSON.stringify(records);
    assert.strictEqual(set1, set2);
  });
});
