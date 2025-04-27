const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware earlier - it now attaches req.user if token is valid,
// but doesn't block requests without a token (we handle that in controller/model)
// Note: If you wanted this GET /:id route to be strictly protected, 
// you would need a different middleware setup or check req.user explicitly in the controller.
// For now, this makes req.user available *if* the user is logged in.
router.use(authMiddleware); 

// --- Routes that can use optional authentication --- 

// Get event by ID (now receives req.user if authenticated)
router.get('/:id', eventController.getEventById);

// Get all events (public - middleware doesn't block, just adds req.user if available)
router.get('/', eventController.getAllEvents);

// Get nearby events (public)
router.get('/nearby', eventController.getNearbyEvents);

// Get events by date range (public)
router.get('/dates', eventController.getEventsByDateRange);


// --- Routes that strictly require authentication (already covered by the router.use above) ---

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
