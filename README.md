# CSV Upload Backend

Backend system with **Upload API**, **Fetch API**, and a standalone **Kafka consumer**, using PostgreSQL, Redis, and Kafka. 

## Prerequisites

- **Node.js** 20+
- **Docker** and **Docker Compose**

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd csv-upload
npm install
```

### 2. Environment

Copy the example env and adjust if needed:

```bash
cp .env.example .env
```

### 3. Start infrastructure

```bash
docker-compose up -d
```

Wait until PostgreSQL, Redis, and Kafka are healthy (e.g. 30–60 seconds for Kafka).

### 4. Database schema

```bash
npm run db:schema
```

### 5. Start the API server

```bash
npm run start
```

The API listens on `http://localhost:3000` (or `PORT` from `.env`).

### 6. Start the Kafka consumer (separate terminal)

```bash
npm run consumer
```

Leave it running so it can process upload events and update the Redis cache.

---

## API Endpoints

### Upload CSV — `POST /api/upload`

- **Content-Type:** `multipart/form-data`
- **Field name:** `file` (CSV file)
- **Success (200):** `{ "success": true, "uploadId": "<hash>", "rowsProcessed": N }`
- **Errors:** 400 (no file, invalid CSV), 503 (Kafka publish failure)

Example with curl:

```bash
curl -X POST http://localhost:3000/api/upload -F "file=@/path/to/data.csv"
```

### Fetch all records — `GET /api/records`

- **Success (200):** `{ "data": [ ... ], "source": "cache" }` or `"source": "database"`
- Serves from Redis when available; falls back to PostgreSQL if Redis is unavailable or empty.

```bash
curl http://localhost:3000/api/records
```

---

## Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/csv_upload` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `KAFKA_BROKERS` | Kafka broker list (comma-separated) | `localhost:29092` |
| `KAFKA_TOPIC` | Topic for upload events | `csv-upload-events` |
| `KAFKA_CLIENT_ID` | Kafka client id for API | `csv-upload-api` |
| `KAFKA_CONSUMER_GROUP` | Consumer group id | `csv-upload-consumer` |
| `CACHE_RECORDS_KEY` | Redis key for “all records” cache | `records:all` |

With the provided `docker-compose.yml`, use **port 29092** for Kafka when the API and consumer run on the host (Bitnami Kafka `PLAINTEXT_HOST`).

---

## Re-upload behaviour (idempotency)

- Each upload is identified by **upload_id** = SHA-256 hash of the **file content**.
- Re-uploading the **exact same file** produces the same **upload_id**.
- For that **upload_id**, the table is updated by **replacing** all rows for that upload in a single transaction (delete existing rows for that `upload_id`, then insert the new rows).
- So re-uploading the same CSV does not create duplicates and does not corrupt data; it simply replaces that batch.

---

## Tests and coverage

Unit tests use Node’s built-in test runner.

Run all tests:

```bash
npm test
```

Run tests with coverage (report written to `coverage/`):

```bash
npm run test:coverage
```

Open `coverage/index.html` in a browser for the full coverage report. Tests cover:

- CSV util (parse, upload id generation)
- Upload route behaviour (validation)
- Repository shape and record mapping
- Fetch API response shape and cache/database source
- Consumer payload and idempotency

**CI:** Run `npm install && npm test` (and optionally `npm run test:coverage`) in your pipeline.

---

## Project structure

```
src/
  api/           Express app, routes, controllers (upload, records)
  consumer/      Standalone Kafka consumer process
  db/            PostgreSQL client, schema runner, repository
  cache/         Redis client and cache helpers
  kafka/         Producer (API) and consumer setup
  middleware/    Error handler
  util/          CSV parse and upload id
tests/           Unit tests
schema.sql       Initial DB schema
docker-compose.yml
```

---

