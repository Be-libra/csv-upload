require('dotenv').config();
const app = require('./app');
const { getProducer, disconnectProducer } = require('../kafka/producer');
const { ensureSchema } = require('../db/runSchema');
const PORT = process.env.PORT || 3000;

async function start() {
  await ensureSchema();

  try {
    await getProducer();
  } catch (err) {
    console.warn('Kafka producer not connected at startup:', err.message);
  }
  const server = app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectProducer();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
