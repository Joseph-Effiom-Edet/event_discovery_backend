const { Category } = require('../models/index.js');

const categoryController = {
  /**
   * Get all categories
   */
  async getAllCategories(req, res) {
    try {
      const categories = await Category.getAll();
      res.json(categories);
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  },

  /**
   * Get a category by ID
   */
  async getCategoryById(req, res) {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await Category.getById(categoryId);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      res.status(500).json({ error: 'Failed to get category' });
    }
  },

  /**
   * Create a new category
   */
  async createCategory(req, res) {
    try {
      const { name, description, icon } = req.body;
      
      // Basic validation
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      const categoryData = {
        name,
        description,
        icon
      };
      
      const newCategory = await Category.create(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error in createCategory:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  },

  /**
   * Update a category
   */
  async updateCategory(req, res) {
    try {
      const categoryId = parseInt(req.params.id);
      const { name, description, icon } = req.body;
      
      // Basic validation
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      const categoryData = {
        name,
        description,
        icon
      };
      
      const updatedCategory = await Category.update(categoryId, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error in updateCategory:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  },

  /**
   * Delete a category
   */
  async deleteCategory(req, res) {
    try {
      const categoryId = parseInt(req.params.id);
      const result = await Category.delete(categoryId);
      
      if (!result) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
};

module.exports = categoryController;