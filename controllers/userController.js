const { User } = require('../models/index');
const { db } = require('../db');
const schema = require('../shared/schema');
const { eq, and, ne } = require('drizzle-orm');

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
        // Check for existing username using Drizzle
        const [existingUser] = await db.select({ id: schema.users.id })
          .from(schema.users)
          .where(and(
            eq(schema.users.username, username),
            ne(schema.users.id, userId) // Exclude the current user
          ));
        
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
      
      // Get the complete user record with password using Drizzle
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));
      
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
