const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');

// Get all events (public)
router.get('/', eventController.getAllEvents);

// Get nearby events (public)
router.get('/nearby', eventController.getNearbyEvents);

// Get events by date range (public)
router.get('/dates', eventController.getEventsByDateRange);

// Get event by ID (public)
router.get('/:id', eventController.getEventById);

// Protected routes - require authentication
router.use(authMiddleware);

// Create a new event
router.post('/', eventController.createEvent);

// Update an event
router.put('/:id', eventController.updateEvent);

// Delete an event
router.delete('/:id', eventController.deleteEvent);

// Register for an event
router.post('/:id/register', eventController.registerForEvent);

// Cancel registration for an event
router.delete('/:id/register', eventController.cancelRegistration);

module.exports = router;
