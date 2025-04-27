const { Event } = require('../models/index');
const { db } = require('../db');
const schema = require('../shared/schema');
const { eq, and, sql } = require('drizzle-orm');

const eventController = {
  // Get all events with filtering
  async getAllEvents(req, res) {
    try {
      console.log('[API Log] Received query params:', req.query);
      const filters = {
        category_id: req.query.category_id,
        search: req.query.search,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        lat: req.query.lat,
        lng: req.query.lng,
        radius: req.query.radius,
        limit: req.query.limit || 20,
        offset: req.query.offset || 0
      };

      const events = await Event.getAll(filters);
      res.json(events);
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  },

  // Get a single event by ID
  async getEventById(req, res) {
    try {
      const eventId = req.params.id;
      const event = await Event.getById(eventId);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json(event);
    } catch (error) {
      console.error('Error in getEventById:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  },

  // Create a new event
  async createEvent(req, res) {
    try {
      // Set the organizer ID to the authenticated user's ID
      const eventData = {
        ...req.body,
        organizer_id: req.user.id
      };
      
      const event = await Event.create(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error('Error in createEvent:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  },

  // Update an existing event
  async updateEvent(req, res) {
    try {
      const eventId = req.params.id;
      const existingEvent = await Event.getById(eventId);
      
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if the user is the organizer of the event
      if (existingEvent.organizer_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this event' });
      }
      
      const eventData = {
        ...req.body,
        organizer_id: existingEvent.organizer_id // Ensure organizer cannot be changed
      };
      
      const updatedEvent = await Event.update(eventId, eventData);
      res.json(updatedEvent);
    } catch (error) {
      console.error('Error in updateEvent:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  },

  // Delete an event
  async deleteEvent(req, res) {
    try {
      const eventId = req.params.id;
      const existingEvent = await Event.getById(eventId);
      
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if the user is the organizer of the event
      if (existingEvent.organizer_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this event' });
      }
      
      await Event.delete(eventId);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  },

  // Get nearby events based on coordinates
  async getNearbyEvents(req, res) {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }
      
      const events = await Event.getNearby(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius) || 10,
        parseInt(req.query.limit) || 20
      );
      
      res.json(events);
    } catch (error) {
      console.error('Error in getNearbyEvents:', error);
      res.status(500).json({ error: 'Failed to fetch nearby events' });
    }
  },

  // Get events by date range
  async getEventsByDateRange(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const events = await Event.getByDateRange(
        start_date,
        end_date,
        parseInt(req.query.limit) || 20
      );
      
      res.json(events);
    } catch (error) {
      console.error('Error in getEventsByDateRange:', error);
      res.status(500).json({ error: 'Failed to fetch events by date range' });
    }
  },

  // Register for an event
  async registerForEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const userId = req.user.id;

      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }
      
      // Fetch event details (including capacity)
      const event = await Event.getById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if the event has capacity (if capacity is defined)
      if (event.capacity !== null && event.capacity !== undefined) {
          const [{ count }] = await db.select({ count: sql`count(*)::int` })
              .from(schema.registrations)
              .where(eq(schema.registrations.event_id, eventId));
          
          if (count >= event.capacity) {
            return res.status(400).json({ error: 'Event has reached capacity' });
          }
      }
      
      // Check if user is already registered
      const [existingRegistration] = await db.select()
        .from(schema.registrations)
        .where(and(
          eq(schema.registrations.event_id, eventId),
          eq(schema.registrations.user_id, userId)
        ));
        
      if (existingRegistration) {
        return res.status(400).json({ error: 'Already registered for this event' });
      }
      
      // Register the user
      const [registration] = await db.insert(schema.registrations)
        .values({ event_id: eventId, user_id: userId })
        .returning();
      
      res.status(201).json(registration);
    } catch (error) {
      console.error('Error in registerForEvent:', error);
      res.status(500).json({ error: 'Failed to register for event' });
    }
  },

  // Cancel registration for an event
  async cancelRegistration(req, res) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const userId = req.user.id;

      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }
      
      // Delete the registration
      const [deletedRegistration] = await db.delete(schema.registrations)
        .where(and(
          eq(schema.registrations.event_id, eventId),
          eq(schema.registrations.user_id, userId)
        ))
        .returning(); // Get the deleted record back to confirm deletion
      
      if (!deletedRegistration) {
        // If nothing was returned, the registration didn't exist
        return res.status(404).json({ error: 'Registration not found' });
      }
      
      res.json({ message: 'Registration cancelled successfully' });
    } catch (error) {
      console.error('Error in cancelRegistration:', error);
      res.status(500).json({ error: 'Failed to cancel registration' });
    }
  }
};

module.exports = eventController;
