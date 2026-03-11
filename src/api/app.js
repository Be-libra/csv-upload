const express = require('express');
const uploadRouter = require('./routes/upload');
const recordsRouter = require('./routes/records');
const { errorHandler } = require('../middleware/errorHandler');

const app = express();
app.use(express.json());

app.use('/api/upload', uploadRouter);
app.use('/api/records', recordsRouter);

app.use(errorHandler);

module.exports = app;
