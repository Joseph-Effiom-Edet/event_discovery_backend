const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Import validation functions
const { body, validationResult } = require('express-validator');

// Middleware to handle validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return only the first error message for simplicity
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Define validation rules
const registerValidationRules = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required')
];

const loginValidationRules = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register a new user
router.post('/register', registerValidationRules, validateRequest, authController.register);

// Login a user
router.post('/login', loginValidationRules, validateRequest, authController.login);

// Validate a token (useful for frontend auth checking)
router.get('/validate', authController.validateToken);

module.exports = router;
