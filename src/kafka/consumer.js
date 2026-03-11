const { Kafka } = require('kafkajs');

function getTopic() {
  return process.env.KAFKA_TOPIC || 'csv-upload-events';
}

function getConsumerGroup() {
  return process.env.KAFKA_CONSUMER_GROUP || 'csv-upload-consumer';
}

function createConsumer(onMessage) {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',').map((b) => b.trim());
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'csv-upload-consumer',
    brokers,
  });
  const consumer = kafka.consumer({ groupId: getConsumerGroup() });
  return { consumer, topic: getTopic(), run: async () => runConsumer(consumer, getTopic(), onMessage) };
}

async function runConsumer(consumer, topic, onMessage) {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic: t, partition, message }) => {
      const payload = message.value?.toString();
      let parsed;
      try {
        parsed = payload ? JSON.parse(payload) : null;
      } catch (e) {
        console.error(`[Consumer] Invalid JSON for partition ${partition} offset ${message.offset}:`, e.message);
        return;
      }
      try {
        await onMessage(parsed, { topic: t, partition, offset: message.offset });
      } catch (err) {
        console.error(`[Consumer] Error processing message partition ${partition} offset ${message.offset}:`, err);
        throw err;
      }
    },
  });
}

module.exports = { getTopic, getConsumerGroup, createConsumer };
