const repository = require('../../db/repository');
const { getCachedRecords, setCachedRecords } = require('../../cache/client');

async function getRecords(req, res, next) {
  try {
    const cached = await getCachedRecords();
    if (cached !== null) {
      return res.json({ data: cached, source: 'cache' });
    }
  } catch (err) {
    console.warn('Cache read failed, falling back to database:', err.message);
  }

  try {
    const records = await repository.getAllRecords();
    await setCachedRecords(records).catch(() => {});
    return res.json({ data: records, source: 'database' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getRecords };
