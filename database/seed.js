/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config({ path: '../.env' }); // Load .env from backend root

const { db } = require('../db');
const { schema } = require('../models/index');
const bcrypt = require('bcrypt');

// Function to get a random item from an array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Function to generate random dates
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // --- Check for existing data --- 
    // We won't clear existing data to avoid accidental deletion,
    // but you can uncomment the lines below if you want a clean slate.
    /*
    console.log('Clearing existing data (excluding users)...');
    await db.delete(schema.bookmarks);
    await db.delete(schema.registrations);
    await db.delete(schema.notifications);
    await db.delete(schema.events);
    await db.delete(schema.categories);
    console.log('Existing data cleared.');
    */

    // --- Fetch existing user (or create one) ---
    let mainUser;
    const users = await db.select().from(schema.users).limit(1);
    if (users.length === 0) {
      console.log('No users found, creating a default user...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('password123', saltRounds);
      [mainUser] = await db.insert(schema.users).values({
        username: 'seed_user',
        email: 'seed@example.com',
        password: hashedPassword,
        name: 'Seed User',
      }).returning();
      console.log(`Created default user with ID: ${mainUser.id}`);
    } else {
      mainUser = users[0];
      console.log(`Using existing user with ID: ${mainUser.id}`);
    }
    const userId = mainUser.id;

    // --- Seed Categories ---
    console.log('Seeding categories...');
    const categoriesData = [
      { name: 'Music', description: 'Live concerts and music festivals', icon: 'music' },
      { name: 'Technology', description: 'Tech talks, hackathons, and conferences', icon: 'computer' },
      { name: 'Food & Drink', description: 'Food festivals, wine tasting, cooking classes', icon: 'fast-food' },
      { name: 'Arts & Culture', description: 'Museum exhibitions, theater, art galleries', icon: 'palette' },
      { name: 'Sports & Fitness', description: 'Marathons, yoga classes, sports games', icon: 'fitness' },
      { name: 'Networking', description: 'Business mixers and professional meetups', icon: 'business' },
      { name: 'Workshops', description: 'Educational workshops and skill-building sessions', icon: 'build' },
      { name: 'Community', description: 'Local gatherings, volunteer events', icon: 'people' },
      { name: 'Film & Media', description: 'Movie screenings, film festivals', icon: 'film' },
      { name: 'Outdoors', description: 'Hiking trips, park events', icon: 'leaf' },
      { name: 'Gaming', description: 'Esports tournaments, board game nights', icon: 'game-controller' },
      { name: 'Charity & Causes', description: 'Fundraising events, awareness campaigns', icon: 'heart' },
    ];
    const insertedCategories = await db.insert(schema.categories).values(categoriesData).onConflictDoNothing().returning();
    console.log(`Inserted ${insertedCategories.length} new categories.`);
    const allCategories = await db.select().from(schema.categories);
    if (allCategories.length === 0) throw new Error("No categories available after seeding.");

    // --- Seed Events ---
    console.log('Seeding events...');
    const eventsData = [];
    const today = new Date();
    const oneMonthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const eventTitles = ['Summer Music Fest', 'AI Conference', 'Downtown Food Fair', 'Modern Art Exhibit', 'City Marathon', 'Tech Innovators Mixer', 'Photography Workshop', 'Park Cleanup Day', 'Indie Film Night', 'Guided Nature Hike', 'Annual Game Jam', 'Charity Gala Dinner'];
    for (let i = 0; i < 12; i++) {
      const startDate = randomDate(today, oneMonthFromNow);
      const endDate = new Date(startDate.getTime() + Math.random() * (3 * 24 * 60 * 60 * 1000)); // Up to 3 days later
      const category = getRandom(allCategories);
      eventsData.push({
        title: eventTitles[i % eventTitles.length] + (i >= eventTitles.length ? ` ${Math.floor(i / eventTitles.length) + 1}` : ''),
        description: `Join us for the ${eventTitles[i % eventTitles.length]}! An exciting event focused on ${category.name}. More details to come soon.`,
        location: `Venue ${i + 1}, ${['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle'][i % 5]}`, // Example locations
        latitude: (Math.random() * 180 - 90).toFixed(8),
        longitude: (Math.random() * 360 - 180).toFixed(8),
        start_date: startDate,
        end_date: endDate,
        image_url: `https://picsum.photos/seed/${i + 1}/400/200`, // Placeholder image
        category_id: category.id,
        organizer_id: userId,
        capacity: Math.floor(Math.random() * 451) + 50, // 50-500
        price: (Math.random() * 100).toFixed(2), // 0-100
      });
    }
    const insertedEvents = await db.insert(schema.events).values(eventsData).onConflictDoNothing().returning();
    console.log(`Inserted ${insertedEvents.length} new events.`);
    const allEvents = await db.select().from(schema.events);
    if (allEvents.length === 0) throw new Error("No events available after seeding.");

    // --- Seed Bookmarks ---
    console.log('Seeding bookmarks...');
    const bookmarksData = [];
    for (let i = 0; i < Math.min(allEvents.length, 15); i++) { // Bookmark up to 15 events
      if (Math.random() > 0.4) { // ~60% chance to bookmark
         bookmarksData.push({ user_id: userId, event_id: allEvents[i].id });
      }
    }
     try {
      const insertedBookmarks = await db.insert(schema.bookmarks).values(bookmarksData).onConflictDoNothing().returning();
      console.log(`Inserted ${insertedBookmarks.length} new bookmarks.`);
    } catch (error) {
      console.error('Error inserting bookmarks (possible duplicates ok):', error.message);
    }

    // --- Seed Registrations ---
    console.log('Seeding registrations...');
    const registrationsData = [];
     for (let i = 0; i < Math.min(allEvents.length, 10); i++) { // Register for up to 10 events
      if (Math.random() > 0.6) { // ~40% chance to register
         registrationsData.push({ user_id: userId, event_id: allEvents[i].id, status: getRandom(['confirmed', 'waitlisted', 'pending']) });
      }
    }
    try {
      const insertedRegistrations = await db.insert(schema.registrations).values(registrationsData).onConflictDoNothing().returning();
      console.log(`Inserted ${insertedRegistrations.length} new registrations.`);
    } catch (error) {
      console.error('Error inserting registrations (possible duplicates ok):', error.message);
    }

    // --- Seed Notifications ---
    console.log('Seeding notifications...');
    const notificationsData = [];
    for (let i = 0; i < 10; i++) {
      const randomEvent = getRandom(allEvents);
      notificationsData.push({
        user_id: userId,
        event_id: Math.random() > 0.3 ? randomEvent.id : null, // Some notifications are event-specific
        title: getRandom(['Upcoming Event Reminder', 'New Event Posted', 'Account Update', 'Event Canceled']),
        message: `Notification message ${i + 1}: Regarding ${randomEvent.title || 'your account'}.`,
        is_read: Math.random() > 0.5, // ~50% read
      });
    }
    const insertedNotifications = await db.insert(schema.notifications).values(notificationsData).onConflictDoNothing().returning();
    console.log(`Inserted ${insertedNotifications.length} new notifications.`);

    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1); // Exit with error code
  } finally {
    // If your db connection pool needs explicit closing, do it here.
    // Typically not needed with Drizzle ORM's default setup.
    console.log('Exiting seed script.');
    // Example: await pool.end(); // If you were using pg Pool directly
    process.exit(0); // Ensure script exits cleanly
  }
}

seedDatabase(); 