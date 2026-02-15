const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken); // NEW
router.post('/logout', authenticateToken, authController.logout); // NEW
router.get('/me', authenticateToken, authController.getCurrentUser);
router.delete('/me', authenticateToken, authController.deleteUser);

module.exports = router;