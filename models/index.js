const { db } = require('../db');
const schema = require('../shared/schema');
const { eq } = require('drizzle-orm');

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

  async updatePassword(id, hashedPassword) {
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
  }
};

/**
 * Event model methods using Drizzle ORM
 */
const Event = {
  async getAll(filters = {}) {
    let query = db.select().from(schema.events);
    
    // Apply filters if provided
    if (filters.categoryId) {
      return await db.select().from(schema.events).where(eq(schema.events.category_id, filters.categoryId));
    }
    
    // TODO: Add more filters as needed
    
    const events = await query;
    return events;
  },

  async getById(id) {
    const [event] = await db.select().from(schema.events).where(eq(schema.events.id, id));
    return event;
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
    const bookmarks = await db.select().from(schema.bookmarks).where(eq(schema.bookmarks.user_id, userId));
    return bookmarks;
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