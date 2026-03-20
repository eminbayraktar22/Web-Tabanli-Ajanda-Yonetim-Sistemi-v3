const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const tagController = require('../controllers/tagController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

const tagValidationRules = [
  check('name', 'Etiket adı zorunludur').not().isEmpty(),
];

router.get('/', tagController.getTags);
router.post('/', tagValidationRules, tagController.createTag);
router.put('/:id', tagValidationRules, tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

module.exports = router;
