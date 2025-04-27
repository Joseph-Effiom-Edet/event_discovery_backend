const { User } = require('../models/index');
const db = require('../db');

const userController = {
  // Get the profile of the authenticated user
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.getById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  // Update the profile of the authenticated user
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { username, email, name, avatar_url } = req.body;
      
      // Validate email and username uniqueness if they are changed
      if (email) {
        const existingUserWithEmail = await User.getByEmail(email);
        if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
          return res.status(400).json({ error: 'Email is already in use' });
        }
      }
      
      if (username) {
        const { rows: [existingUser] } = await db.query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [username, userId]
        );
        
        if (existingUser) {
          return res.status(400).json({ error: 'Username is already in use' });
        }
      }
      
      const userData = {
        username: username || req.user.username,
        email: email || req.user.email,
        name: name || req.user.name,
        avatar_url: avatar_url || req.user.avatar_url
      };
      
      const updatedUser = await User.update(userId, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  },

  // Change the password of the authenticated user
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required' });
      }
      
      // Get the complete user record with password
      const { rows: [user] } = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify the current password
      const isPasswordValid = await User.verifyPassword(user, currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // Update the password
      await User.updatePassword(userId, newPassword);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error in changePassword:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  },

  // Get events the user has registered for
  async getRegisteredEvents(req, res) {
    try {
      const userId = req.user.id;
      const events = await User.getRegisteredEvents(userId);
      res.json(events);
    } catch (error) {
      console.error('Error in getRegisteredEvents:', error);
      res.status(500).json({ error: 'Failed to fetch registered events' });
    }
  },

  // Delete the authenticated user's account
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      
      // Delete the user
      const deletedUser = await User.delete(userId);
      
      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }
};

module.exports = userController;
