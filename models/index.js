const { db } = require('../db');
const schema = require('../shared/schema');
const { eq, and, sql } = require('drizzle-orm');
const bcrypt = require('bcrypt');

/**
 * User model methods using Drizzle ORM
 */
const User = {
  async getById(id) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  },

  async getByEmail(email) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  },

  async create(userData) {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  },

  async update(id, userData) {
    const [user] = await db
      .update(schema.users)
      .set({ ...userData, updated_at: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  },

  async updatePassword(id, newPassword) {
    // Hash the new password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await db
      .update(schema.users)
      .set({ password: hashedPassword, updated_at: new Date() })
      .where(eq(schema.users.id, id));
    return true;
  },

  async delete(id) {
    const [user] = await db.delete(schema.users).where(eq(schema.users.id, id)).returning({ id: schema.users.id });
    return user;
  },

  async getRegisteredEvents(userId) {
    const result = await db
      .select({
        events: schema.events
      })
      .from(schema.events)
      .innerJoin(schema.registrations, eq(schema.events.id, schema.registrations.event_id))
      .where(eq(schema.registrations.user_id, userId))
      .orderBy(schema.events.start_date);
    
    return result.map(({ events }) => events);
  },

  // Add method to verify password
  async verifyPassword(user, plainPassword) {
    if (!user || !user.password || !plainPassword) {
      return false;
    }
    try {
      return await bcrypt.compare(plainPassword, user.password);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
  }
};

/**
 * Event model methods using Drizzle ORM
 */
const Event = {
  async getAll(filters = {}) {
    console.log('[DB Log] Event.getAll received filters:', filters);
    // Start with the base query
    let query = db.select().from(schema.events);
    
    // Build an array of conditions for the WHERE clause
    const conditions = [];

    // Apply category filter
    if (filters.category_id) {
      const categoryId = parseInt(filters.category_id, 10);
      if (!isNaN(categoryId)) {
          conditions.push(eq(schema.events.category_id, categoryId));
      }
    }

    // Apply location filter (using Haversine formula)
    if (filters.lat && filters.lng && filters.radius) {
      const lat = parseFloat(filters.lat);
      const lng = parseFloat(filters.lng);
      const radius = parseFloat(filters.radius); // Assuming radius is in kilometers

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
        // Haversine formula parts (SQL)
        // 6371 is the approximate radius of the Earth in km
        const R = 6371;
        const lat1Rad = sql`radians(${lat})`;
        const lng1Rad = sql`radians(${lng})`;
        const lat2Rad = sql`radians(${schema.events.latitude})`;
        const lng2Rad = sql`radians(${schema.events.longitude})`;

        const dLat = sql`(${lat2Rad} - ${lat1Rad})`;
        const dLng = sql`(${lng2Rad} - ${lng1Rad})`;

        const a = sql`sin(${dLat} / 2) * sin(${dLat} / 2) + cos(${lat1Rad}) * cos(${lat2Rad}) * sin(${dLng} / 2) * sin(${dLng} / 2)`;
        // Use LEAST(1.0, ...) to avoid issues with floating point errors potentially making the value slightly > 1 for atan2
        const c = sql`2 * atan2(sqrt(least(1.0, ${a})), sqrt(greatest(0.0, 1 - ${a})))`; 
        const distance = sql`${R} * ${c}`;

        // Add the distance condition
        conditions.push(sql`${distance} <= ${radius}`);
      }
    }
    
    // TODO: Add other filters here, pushing to the `conditions` array
    // Example: Search filter
    // if (filters.search) {
    //   conditions.push(sql`lower(${schema.events.title}) like ${'%' + filters.search.toLowerCase() + '%'}`);
    // }

    console.log('[DB Log] Conditions built:', conditions);

    // Apply conditions if any exist
    if (conditions.length > 0) {
        query = query.where(and(...conditions)); // Use 'and' to combine multiple conditions
    }

    // TODO: Add limit and offset later if needed
    // if (filters.limit) { query = query.limit(filters.limit); }
    // if (filters.offset) { query = query.offset(filters.offset); }

    // Execute the final query
    const events = await query;
    return events;
  },

  async getById(id, userId = null) {
    // Base query to get event and category name
    let eventQuery = db
      .select({
        ...schema.events,
        category_name: schema.categories.name 
      })
      .from(schema.events)
      .leftJoin(schema.categories, eq(schema.events.category_id, schema.categories.id))
      .where(eq(schema.events.id, id));

    const results = await eventQuery;
    let event = results[0];

    // If event found and a user ID was provided, check registration status
    if (event && userId !== null) {
      console.log(`[DB Log] Checking registration for user ${userId} and event ${id}`);
      const [registration] = await db.select({ id: schema.registrations.id })
        .from(schema.registrations)
        .where(and(
          eq(schema.registrations.event_id, id),
          eq(schema.registrations.user_id, userId)
        ))
        .limit(1);
        
      // Add the registration status to the event object
      event.isCurrentUserRegistered = !!registration; // Convert to boolean (true if registration exists)
      console.log(`[DB Log] User ${userId} registration status for event ${id}:`, event.isCurrentUserRegistered);
    } else if (event) {
      // Ensure the field exists even if user is not logged in
      event.isCurrentUserRegistered = false; 
    }

    return event; // Return the event object (potentially with registration status)
  },

  async create(eventData) {
    const [event] = await db.insert(schema.events).values(eventData).returning();
    return event;
  },

  async update(id, eventData) {
    const [event] = await db
      .update(schema.events)
      .set({ ...eventData, updated_at: new Date() })
      .where(eq(schema.events.id, id))
      .returning();
    return event;
  },

  async delete(id) {
    const [event] = await db.delete(schema.events).where(eq(schema.events.id, id)).returning({ id: schema.events.id });
    return event;
  },

  // More methods to be added based on requirements
};

/**
 * Category model methods using Drizzle ORM
 */
const Category = {
  async getAll() {
    const categories = await db.select().from(schema.categories);
    return categories;
  },

  async getById(id) {
    const [category] = await db.select().from(schema.categories).where(eq(schema.categories.id, id));
    return category;
  },

  async create(categoryData) {
    const [category] = await db.insert(schema.categories).values(categoryData).returning();
    return category;
  },

  async update(id, categoryData) {
    const [category] = await db
      .update(schema.categories)
      .set({ ...categoryData, updated_at: new Date() })
      .where(eq(schema.categories.id, id))
      .returning();
    return category;
  },

  async delete(id) {
    const [category] = await db.delete(schema.categories).where(eq(schema.categories.id, id)).returning({ id: schema.categories.id });
    return category;
  }
};

/**
 * Bookmark model methods using Drizzle ORM
 */
const Bookmark = {
  async getByUserId(userId) {
    // Join bookmarks with events to return full event details
    const results = await db
      .select({
          // Select all fields from the events table
          ...schema.events 
      })
      .from(schema.bookmarks)
      .innerJoin(schema.events, eq(schema.bookmarks.event_id, schema.events.id))
      .where(eq(schema.bookmarks.user_id, userId))
      .orderBy(schema.events.start_date); // Optional: Order by event start date
      
    // The select shape directly gives us the event objects
    return results; 
  },

  async getByUserAndEvent(userId, eventId) {
    const [bookmark] = await db
      .select()
      .from(schema.bookmarks)
      .where(
        eq(schema.bookmarks.user_id, userId) && 
        eq(schema.bookmarks.event_id, eventId)
      );
    return bookmark;
  },

  async create(userId, eventId) {
    const [bookmark] = await db
      .insert(schema.bookmarks)
      .values({ user_id: userId, event_id: eventId })
      .returning();
    return bookmark;
  },

  async deleteByUserAndEvent(userId, eventId) {
    const [bookmark] = await db
      .delete(schema.bookmarks)
      .where(
        eq(schema.bookmarks.user_id, userId) && 
        eq(schema.bookmarks.event_id, eventId)
      )
      .returning();
    return bookmark;
  },

  async isBookmarked(userId, eventId) {
    const bookmark = await this.getByUserAndEvent(userId, eventId);
    return !!bookmark;
  }
};

module.exports = {
  User,
  Event,
  Category,
  Bookmark,
  schema
};