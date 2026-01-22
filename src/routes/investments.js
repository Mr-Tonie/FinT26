const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', investmentController.getInvestments);
router.get('/statistics', investmentController.getPortfolioStats);
router.post('/', investmentController.createInvestment);
router.put('/:id', investmentController.updateInvestment);
router.delete('/:id', investmentController.deleteInvestment);

module.exports = router;