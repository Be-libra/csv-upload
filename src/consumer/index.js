require('dotenv').config();
const { createConsumer } = require('../kafka/consumer');
const repository = require('../db/repository');
const { setCachedRecords } = require('../cache/client');

const MAX_RETRIES = 15;
const INITIAL_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function onMessage(payload, { partition, offset }) {
  const uploadId = payload?.uploadId ?? 'unknown';
  const rowCount = payload?.rowCount ?? 0;
  console.log(`[Consumer] Processing event uploadId=${uploadId} rowCount=${rowCount} partition=${partition} offset=${offset}`);

  const records = await repository.getAllRecords();
  await setCachedRecords(records);
  console.log(`[Consumer] Cache updated with ${records.length} records (uploadId=${uploadId} partition=${partition} offset=${offset})`);
}

async function main() {
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('Shutting down consumer...');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  while (!shuttingDown) {
    const { consumer, run } = createConsumer(onMessage);
    let attempt = 0;
    while (attempt < MAX_RETRIES && !shuttingDown) {
      try {
        await run();
        console.log('Kafka consumer running. Waiting for messages...');
        await new Promise((_, reject) => {
          consumer.on('consumer.crash', reject);
          consumer.on('consumer.disconnect', reject);
        }).catch(async (e) => {
          if (!shuttingDown) {
            console.warn('[Consumer] Crashed or disconnected, reconnecting in 3s...', e?.message || e);
            try {
              await consumer.disconnect();
            } catch (_) {}
          }
        });
        break;
      } catch (err) {
        try {
          await consumer.disconnect();
        } catch (_) {}
        const isCoordinatorOrLeaderError =
          err.message?.includes('group coordinator') ||
          err.message?.includes('GroupCoordinator') ||
          err.message?.includes('leader') ||
          err.message?.includes('leadership election');
        if (isCoordinatorOrLeaderError && attempt < MAX_RETRIES - 1) {
          attempt++;
          const delay = INITIAL_DELAY_MS * Math.min(attempt, 5);
          console.warn(`[Consumer] Kafka not ready (${err.message}). Retry ${attempt}/${MAX_RETRIES} in ${delay}ms...`);
          await sleep(delay);
        } else {
          attempt++;
          console.warn(`[Consumer] Error: ${err.message}. Retry ${attempt}/${MAX_RETRIES} in 5s...`);
          await sleep(5000);
        }
      }
    }
    if (shuttingDown) break;
    await sleep(3000);
  }
}

main().catch((err) => {
  console.error('Consumer failed:', err);
  process.exit(1);
});
