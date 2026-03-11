const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateUploadId, parseCsv } = require('../src/util/csv');

describe('csv util', () => {
  describe('generateUploadId', () => {
    it('returns 64-char hex string', () => {
      const id = generateUploadId(Buffer.from('hello'));
      assert.strictEqual(id.length, 64);
      assert.ok(/^[a-f0-9]+$/.test(id));
    });
    it('same content yields same id', () => {
      const b = Buffer.from('name,age\nAlice,30');
      assert.strictEqual(generateUploadId(b), generateUploadId(b));
    });
    it('different content yields different id', () => {
      const id1 = generateUploadId(Buffer.from('a'));
      const id2 = generateUploadId(Buffer.from('b'));
      assert.notStrictEqual(id1, id2);
    });
  });

  describe('parseCsv', () => {
    it('parses CSV with headers into array of objects', () => {
      const buf = Buffer.from('name,age\nAlice,30\nBob,25');
      const rows = parseCsv(buf);
      assert.strictEqual(rows.length, 2);
      assert.strictEqual(rows[0].name, 'Alice');
      assert.strictEqual(rows[0].age, '30');
      assert.strictEqual(rows[1].name, 'Bob');
      assert.strictEqual(rows[1].age, '25');
    });
    it('returns empty array for header-only CSV', () => {
      const buf = Buffer.from('name,age\n');
      const rows = parseCsv(buf);
      assert.strictEqual(rows.length, 0);
    });
    it('trims values', () => {
      const buf = Buffer.from('a,b\n  x  ,  y  ');
      const rows = parseCsv(buf);
      assert.strictEqual(rows[0].a, 'x');
      assert.strictEqual(rows[0].b, 'y');
    });
  });
});
