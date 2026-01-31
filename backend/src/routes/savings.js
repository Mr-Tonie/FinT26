const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', savingsController.getSavingsGoals);
router.post('/', savingsController.createSavingsGoal);
router.put('/:id', savingsController.updateSavingsGoal);
router.delete('/:id', savingsController.deleteSavingsGoal);

module.exports = router;
