const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const authMiddleware = require('../middleware/auth');

// All bookmark routes require authentication
router.use(authMiddleware);

// Get all bookmarks for the authenticated user
router.get('/', bookmarkController.getUserBookmarks);

// Add a bookmark
router.post('/:eventId', bookmarkController.addBookmark);

// Remove a bookmark
router.delete('/:eventId', bookmarkController.removeBookmark);

// Check if an event is bookmarked
router.get('/:eventId/check', bookmarkController.checkBookmark);

module.exports = router;
