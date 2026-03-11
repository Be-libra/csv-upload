const multer = require('multer');
const repository = require('../../db/repository');
const { publishUploadEvent } = require('../../kafka/producer');
const { generateUploadId, parseCsv } = require('../../util/csv');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
    if (ok) cb(null, true);
    else cb(new Error('Only CSV files are allowed'));
  },
}).single('file');

async function handleUpload(req, res, next) {
  upload(req, res, async (err) => {
    if (err) {
      err.statusCode = 400;
      return next(err);
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    let uploadId;
    let rowsProcessed = 0;

    try {
      const rows = parseCsv(req.file.buffer);
      if (rows.length === 0) {
        return res.status(400).json({ success: false, error: 'CSV file has no data rows' });
      }

      uploadId = generateUploadId(req.file.buffer);
      rowsProcessed = await repository.replaceRecordsForUpload(uploadId, rows);
    } catch (e) {
      if (e.message && e.message.includes('parse')) {
        const err = new Error('Invalid CSV format');
        err.statusCode = 400;
        return next(err);
      }
      return next(e);
    }

    try {
      await publishUploadEvent({
        uploadId,
        rowCount: rowsProcessed,
        timestamp: new Date().toISOString(),
      });
    } catch (kafkaErr) {
      console.error('Kafka publish failed:', kafkaErr);
      const err = new Error('Failed to publish event');
      err.statusCode = 503;
      return next(err);
    }

    return res.status(200).json({
      success: true,
      uploadId,
      rowsProcessed,
    });
  });
}

module.exports = { handleUpload };
