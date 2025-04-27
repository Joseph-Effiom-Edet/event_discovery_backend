const { pgTable, serial, text, timestamp, varchar, decimal, integer, boolean, unique } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Users table
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Categories table
const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Events table
const events = pgTable('events', {
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

// Registrations table
const registrations = pgTable('registrations', {
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

// Bookmarks table
const bookmarks = pgTable('bookmarks', {
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

// Notifications table
const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  event_id: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at').defaultNow()
});

// Define relations between tables
const usersRelations = relations(users, ({ many }) => ({
  events: many(events, { relationName: 'user_events' }),
  registrations: many(registrations, { relationName: 'user_registrations' }),
  bookmarks: many(bookmarks, { relationName: 'user_bookmarks' }),
  notifications: many(notifications, { relationName: 'user_notifications' })
}));

const categoriesRelations = relations(categories, ({ many }) => ({
  events: many(events, { relationName: 'category_events' })
}));

const eventsRelations = relations(events, ({ one, many }) => ({
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

const registrationsRelations = relations(registrations, ({ one }) => ({
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

const bookmarksRelations = relations(bookmarks, ({ one }) => ({
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

const notificationsRelations = relations(notifications, ({ one }) => ({
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

module.exports = {
  users,
  categories,
  events,
  registrations,
  bookmarks,
  notifications,
  usersRelations,
  categoriesRelations,
  eventsRelations,
  registrationsRelations,
  bookmarksRelations,
  notificationsRelations
};