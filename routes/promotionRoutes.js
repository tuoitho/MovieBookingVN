const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Public routes
router.post('/apply', promotionController.applyPromotion);
router.post('/:id/validate', promotionController.validatePromotion);

// Admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
    .get(promotionController.getPromotions)
    .post(promotionController.createPromotion);

router.route('/:id')
    .get(promotionController.getPromotion)
    .put(promotionController.updatePromotion)
    .delete(promotionController.deletePromotion);

router.post('/:id/increment-usage', promotionController.incrementUsage);

module.exports = router; 