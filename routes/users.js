const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Protected routes - require authentication
router.use(authMiddleware);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', userController.updateProfile);

// Change password
router.put('/password', userController.changePassword);

// Get user's registered events
router.get('/events', userController.getRegisteredEvents);

// Delete user account
router.delete('/', userController.deleteAccount);

module.exports = router;
