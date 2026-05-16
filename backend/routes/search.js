const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const searchController = require('../controllers/searchController');

router.use(authMiddleware);
router.get('/', searchController.search);

module.exports = router;
