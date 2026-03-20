const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Validasyon kuralları
const categoryValidationRules = [
  check('name', 'Kategori adı zorunludur').not().isEmpty(),
  check('color_hex', 'Geçerli bir HEX renk kodu girmelisiniz (# ile başlayan, örn: #ff0000 veya #f00)')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/),
];

router.get('/', categoryController.getCategories);
router.post('/', categoryValidationRules, categoryController.createCategory);
router.put('/:id', categoryValidationRules, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
