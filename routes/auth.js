const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register a new user
router.post('/register', authController.register);

// Login a user
router.post('/login', authController.login);

// Validate a token (useful for frontend auth checking)
router.get('/validate', authController.validateToken);

module.exports = router;
