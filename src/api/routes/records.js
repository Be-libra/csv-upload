const express = require('express');
const router = express.Router();
const { getRecords } = require('../controllers/recordsController');

router.get('/', getRecords);

module.exports = router;
