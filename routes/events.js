const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');
// Import validation functions
const { body, query, param, validationResult } = require('express-validator');

// Middleware to handle validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array({ onlyFirstError: true })[0].msg });
  }
  next();
};

// Validation rules for creating/updating events
const eventValidationRules = [
  body('title').notEmpty().withMessage('Title is required').trim().escape(),
  body('description').notEmpty().withMessage('Description is required').trim().escape(),
  body('location').notEmpty().withMessage('Location is required').trim().escape(),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('start_date').isISO8601().toDate().withMessage('Valid start date is required'),
  body('end_date').isISO8601().toDate().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (value <= req.body.start_date) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('category_id').isInt({ gt: 0 }).withMessage('Valid category ID is required'),
  body('capacity').optional().isInt({ min: 0 }).withMessage('Capacity must be a non-negative integer'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('image_url').optional().isURL().withMessage('Image URL must be valid')
];

// Validation rules for query parameters
const getEventsQueryValidation = [
  query('category_id').optional().isInt({ gt: 0 }).withMessage('Category ID must be a positive integer'),
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required for location filter'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required for location filter'),
  query('radius').optional().isFloat({ gt: 0 }).withMessage('Radius must be a positive number'),
  query('start_date').optional().isISO8601().toDate().withMessage('Invalid start date format'),
  query('end_date').optional().isISO8601().toDate().withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.start_date && value <= req.query.start_date) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer')
];

// Validation rule for ID parameter
const idParamValidation = [
  param('id').isInt({ gt: 0 }).withMessage('Event ID must be a positive integer')
];
const eventIdParamValidation = [
  param('eventId').isInt({ gt: 0 }).withMessage('Event ID must be a positive integer')
]; // Used in bookmarks

// Apply auth middleware earlier - it now attaches req.user if token is valid,
// but doesn't block requests without a token (we handle that in controller/model)
// Note: If you wanted this GET /:id route to be strictly protected, 
// you would need a different middleware setup or check req.user explicitly in the controller.
// For now, this makes req.user available *if* the user is logged in.
router.use(authMiddleware); 

// --- Routes that can use optional authentication --- 

// Get event by ID (now receives req.user if authenticated)
router.get('/:id', idParamValidation, validateRequest, eventController.getEventById);

// Get all events (public - middleware doesn't block, just adds req.user if available)
router.get('/', getEventsQueryValidation, validateRequest, eventController.getAllEvents);

// Get nearby events (public)
router.get('/nearby', [
    query('lat').exists().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    query('lng').exists().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    query('radius').optional().isFloat({ gt: 0 }).withMessage('Radius must be a positive number'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer')
], validateRequest, eventController.getNearbyEvents);

// Get events by date range (public)
router.get('/dates', [
    query('start_date').exists().isISO8601().toDate().withMessage('Valid start date is required'),
    query('end_date').exists().isISO8601().toDate().withMessage('Valid end date is required')
      .custom((value, { req }) => {
        if (value <= req.query.start_date) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer')
], validateRequest, eventController.getEventsByDateRange);


// --- Routes that strictly require authentication (already covered by the router.use above) ---

// Create a new event
router.post('/', eventValidationRules, validateRequest, eventController.createEvent);

// Update an event
router.put('/:id', idParamValidation, eventValidationRules, validateRequest, eventController.updateEvent);

// Delete an event
router.delete('/:id', idParamValidation, validateRequest, eventController.deleteEvent);

// Register for an event
router.post('/:id/register', idParamValidation, validateRequest, eventController.registerForEvent);

// Cancel registration for an event
router.delete('/:id/register', idParamValidation, validateRequest, eventController.cancelRegistration);

module.exports = router;
