const { Bookmark } = require('../models/index');

const bookmarkController = {
  // Get all bookmarks for the authenticated user
  async getUserBookmarks(req, res) {
    try {
      const userId = req.user.id;
      const bookmarks = await Bookmark.getByUserId(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error('Error in getUserBookmarks:', error);
      res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
  },

  // Add a bookmark
  async addBookmark(req, res) {
    try {
      const userId = req.user.id;
      const eventId = req.params.eventId;
      
      // Check if the bookmark already exists
      const existingBookmark = await Bookmark.getByUserAndEvent(userId, eventId);
      
      if (existingBookmark) {
        return res.status(400).json({ error: 'Event is already bookmarked' });
      }
      
      const bookmark = await Bookmark.create(userId, eventId);
      res.status(201).json(bookmark);
    } catch (error) {
      console.error('Error in addBookmark:', error);
      res.status(500).json({ error: 'Failed to add bookmark' });
    }
  },

  // Remove a bookmark
  async removeBookmark(req, res) {
    try {
      const userId = req.user.id;
      const eventId = req.params.eventId;
      
      const bookmark = await Bookmark.deleteByUserAndEvent(userId, eventId);
      
      if (!bookmark) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }
      
      res.json({ message: 'Bookmark removed successfully' });
    } catch (error) {
      console.error('Error in removeBookmark:', error);
      res.status(500).json({ error: 'Failed to remove bookmark' });
    }
  },

  // Check if an event is bookmarked by the user
  async checkBookmark(req, res) {
    try {
      const userId = req.user.id;
      const eventId = req.params.eventId;
      
      const isBookmarked = await Bookmark.isBookmarked(userId, eventId);
      res.json({ isBookmarked });
    } catch (error) {
      console.error('Error in checkBookmark:', error);
      res.status(500).json({ error: 'Failed to check bookmark status' });
    }
  }
};

module.exports = bookmarkController;
