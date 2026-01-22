const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', transactionController.getTransactions);
router.get('/statistics', transactionController.getStatistics);
router.post('/', transactionController.createTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;