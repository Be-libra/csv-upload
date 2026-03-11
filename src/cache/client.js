const Redis = require('ioredis');

let redis = null;

function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL environment variable is required');
    }
    redis = new Redis(url);
  }
  return redis;
}

function getCacheKey() {
  return process.env.CACHE_RECORDS_KEY || 'records:all';
}

async function getCachedRecords() {
  try {
    const redis = getRedis();
    const key = getCacheKey();
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

async function setCachedRecords(records) {
  try {
    const redis = getRedis();
    const key = getCacheKey();
    await redis.set(key, JSON.stringify(records));
  } catch (err) {
    console.error('Redis set error:', err.message);
  }
}

async function isRedisAvailable() {
  try {
    const r = getRedis();
    await r.ping();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  getRedis,
  getCacheKey,
  getCachedRecords,
  setCachedRecords,
  isRedisAvailable,
};
