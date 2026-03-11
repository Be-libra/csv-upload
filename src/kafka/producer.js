const { Kafka } = require('kafkajs');
let kafka = null;
let producer = null;

function getTopic() {
  return process.env.KAFKA_TOPIC || 'csv-upload-events';
}

function getKafka() {
  if (!kafka) {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',').map((b) => b.trim());
    kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'csv-upload-api',
      brokers,
    });
  }
  return kafka;
}

async function getProducer() {
  if (!producer) {
    producer = getKafka().producer();
    await producer.connect();
  }
  return producer;
}

async function publishUploadEvent(payload) {
  const p = await getProducer();
  const topic = getTopic();
  await p.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });
}

async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}

module.exports = { getKafka, getProducer, getTopic, publishUploadEvent, disconnectProducer };
