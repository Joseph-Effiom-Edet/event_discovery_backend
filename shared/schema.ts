import { pgTable, serial, text, timestamp, varchar, decimal, integer, boolean, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Define User type for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Define Category type for TypeScript
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Events table
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  image_url: text('image_url'),
  category_id: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  organizer_id: integer('organizer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  capacity: integer('capacity'),
  price: decimal('price', { precision: 10, scale: 2 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Define Event type for TypeScript
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// Registrations table
export const registrations = pgTable('registrations', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  registration_date: timestamp('registration_date').defaultNow(),
  status: varchar('status', { length: 20 }).default('confirmed'),
  // Unique constraint to ensure a user can't register for the same event multiple times
}, (table) => {
  return {
    unq: unique().on(table.user_id, table.event_id)
  };
});

// Define Registration type for TypeScript
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

// Bookmarks table
export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow(),
  // Unique constraint to ensure a user can't bookmark the same event multiple times
}, (table) => {
  return {
    unq: unique().on(table.user_id, table.event_id)
  };
});

// Define Bookmark type for TypeScript
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  event_id: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at').defaultNow()
});

// Define Notification type for TypeScript
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  events: many(events, { relationName: 'user_events' }),
  registrations: many(registrations, { relationName: 'user_registrations' }),
  bookmarks: many(bookmarks, { relationName: 'user_bookmarks' }),
  notifications: many(notifications, { relationName: 'user_notifications' })
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  events: many(events, { relationName: 'category_events' })
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  category: one(categories, {
    fields: [events.category_id],
    references: [categories.id],
    relationName: 'category_events'
  }),
  organizer: one(users, {
    fields: [events.organizer_id],
    references: [users.id],
    relationName: 'user_events'
  }),
  registrations: many(registrations, { relationName: 'event_registrations' }),
  bookmarks: many(bookmarks, { relationName: 'event_bookmarks' }),
  notifications: many(notifications, { relationName: 'event_notifications' })
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.user_id],
    references: [users.id],
    relationName: 'user_registrations'
  }),
  event: one(events, {
    fields: [registrations.event_id],
    references: [events.id],
    relationName: 'event_registrations'
  })
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.user_id],
    references: [users.id],
    relationName: 'user_bookmarks'
  }),
  event: one(events, {
    fields: [bookmarks.event_id],
    references: [events.id],
    relationName: 'event_bookmarks'
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
    relationName: 'user_notifications'
  }),
  event: one(events, {
    fields: [notifications.event_id],
    references: [events.id],
    relationName: 'event_notifications'
  })
}));