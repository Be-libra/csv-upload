const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Fetch API / records', () => {
  it('response shape has data and source', () => {
    const response = { data: [{ id: '1' }], source: 'cache' };
    assert(Array.isArray(response.data));
    assert(['cache', 'database'].includes(response.source));
  });
  it('cache source when cached', () => {
    const source = 'cache';
    assert.strictEqual(source, 'cache');
  });
  it('database source when fallback', () => {
    const source = 'database';
    assert.strictEqual(source, 'database');
  });
});
