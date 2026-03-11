const { describe, it } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const { parse } = require('csv-parse/sync');

describe('Upload API', () => {
  describe('CSV parse behavior', () => {
    it('parse with columns true yields objects', () => {
      const rows = parse('name,age\nAlice,30', { columns: true, skip_empty_lines: true });
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0].name, 'Alice');
      assert.strictEqual(rows[0].age, '30');
    });
  });
});

function createMinimalUploadApp() {
  const express = require('express');
  const multer = require('multer');
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() }).single('file');
  app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file' });
      const { parse } = require('csv-parse/sync');
      const rows = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true });
      if (rows.length === 0) return res.status(400).json({ error: 'No data rows' });
      res.json({ success: true, rowsProcessed: rows.length });
    });
  });
  return app;
}

describe('Upload route', () => {
  it('returns 400 when no file in body', async () => {
    const app = createMinimalUploadApp();
    const server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const res = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: 'localhost',
          port,
          path: '/upload',
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
        resolve
      );
      req.on('error', reject);
      req.write('foo=bar');
      req.end();
    });
    let body = '';
    for await (const chunk of res) body += chunk;
    await new Promise((resolve) => server.close(resolve));
    assert.strictEqual(res.statusCode, 400);
  });
});
