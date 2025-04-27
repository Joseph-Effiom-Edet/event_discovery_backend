// require('dotenv').config({ path: '../.env' }); // Removed - moved to db.js
const { db } = require('../db'); // Adjust path as necessary
const schema = require('../shared/schema'); // Adjust path as necessary
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker'); // Using faker for realistic data

const SALT_ROUNDS = 10;

// --- Nigerian Cities with Approximate Coordinates ---
const nigerianLocations = [
  { city: 'Lagos', state: 'Lagos', latitude: 6.5244, longitude: 3.3792 },
  { city: 'Kano', state: 'Kano', latitude: 12.0022, longitude: 8.5920 },
  { city: 'Ibadan', state: 'Oyo', latitude: 7.3775, longitude: 3.9470 },
  { city: 'Abuja', state: 'FCT', latitude: 9.0765, longitude: 7.3986 },
  { city: 'Port Harcourt', state: 'Rivers', latitude: 4.8156, longitude: 7.0498 },
  { city: 'Benin City', state: 'Edo', latitude: 6.3350, longitude: 5.6037 },
  { city: 'Kaduna', state: 'Kaduna', latitude: 10.5222, longitude: 7.4383 },
  { city: 'Enugu', state: 'Enugu', latitude: 6.4413, longitude: 7.4983 },
  { city: 'Calabar', state: 'Cross River', latitude: 4.9730, longitude: 8.3255 },
  { city: 'Jos', state: 'Plateau', latitude: 9.8965, longitude: 8.8583 },
];

// --- Helper Functions ---
function getRandomLocation() {
  const location = faker.helpers.arrayElement(nigerianLocations);
  return {
    location: `${location.city}, ${location.state} State, Nigeria`,
    latitude: location.latitude + (Math.random() - 0.5) * 0.05, // Add slight variation
    longitude: location.longitude + (Math.random() - 0.5) * 0.05,
  };
}

function getRandomDatePair() {
  const startDate = faker.date.soon({ days: 30 }); // Start within the next 30 days
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + faker.number.int({ min: 2, max: 8 })); // Event duration 2-8 hours
  return { startDate, endDate };
}

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // --- Clear Existing Data (Use with caution!) ---
    // Consider disabling or modifying this in production environments
    console.log('Clearing existing data (Events, Categories, Test Organizer)...');
    // Order matters due to foreign key constraints
    await db.delete(schema.events);
    await db.delete(schema.categories);
    // Optionally delete a specific test user if it exists
    // await db.delete(schema.users).where(eq(schema.users.email, 'organizer@test.com'));
    console.log('Existing data cleared.');


    // --- Seed Categories ---
    console.log('Seeding categories...');
    const categoriesData = [
      { name: 'Music', description: 'Live concerts, festivals, and music events.', icon: 'music' },
      { name: 'Tech', description: 'Conferences, workshops, and meetups about technology.', icon: 'cpu' },
      { name: 'Food & Drink', description: 'Food festivals, cooking classes, and dining experiences.', icon: 'coffee' },
      { name: 'Arts & Culture', description: 'Exhibitions, theatre, performances, and cultural events.', icon: 'image' },
      { name: 'Business', description: 'Networking events, workshops, and conferences.', icon: 'briefcase' },
      { name: 'Community', description: 'Local gatherings, volunteer events, and meetups.', icon: 'users' },
    ];
    const insertedCategories = await db.insert(schema.categories).values(categoriesData).returning();
    console.log(`Inserted ${insertedCategories.length} categories.`);
    const categoryMap = new Map(insertedCategories.map(cat => [cat.name, cat.id]));


    // --- Seed Organizer User ---
    console.log('Seeding organizer user...');
    const organizerPassword = 'password123'; // Simple password for seeding
    const hashedOrganizerPassword = await bcrypt.hash(organizerPassword, SALT_ROUNDS);
    const organizerData = {
      username: 'eventmaster_ng',
      email: 'organizer@test.com',
      password: hashedOrganizerPassword,
      name: 'EventMaster Nigeria',
      avatar_url: faker.image.avatar(),
    };
    const [organizer] = await db.insert(schema.users).values(organizerData).returning();
    console.log(`Inserted organizer user: ${organizer.email} (Password: ${organizerPassword})`);


    // --- Seed Events ---
    console.log('Seeding events...');
    const eventsData = [];
    const numberOfEvents = 25; // Number of events to seed

    for (let i = 0; i < numberOfEvents; i++) {
      const categoryName = faker.helpers.arrayElement(categoriesData).name;
      const categoryId = categoryMap.get(categoryName);
      const locationInfo = getRandomLocation();
      const dateInfo = getRandomDatePair();

      eventsData.push({
        title: faker.lorem.words(faker.number.int({ min: 3, max: 7 })) + ` in ${locationInfo.location.split(',')[0]}`, // E.g., "Awesome Tech Meetup in Lagos"
        description: faker.lorem.paragraphs(2),
        location: locationInfo.location,
        latitude: locationInfo.latitude.toString(),
        longitude: locationInfo.longitude.toString(),
        start_date: dateInfo.startDate,
        end_date: dateInfo.endDate,
        image_url: faker.image.urlLoremFlickr({ category: categoryName.toLowerCase().split(' ')[0], width: 640, height: 480 }), // Use category for image hint
        category_id: categoryId,
        organizer_id: organizer.id,
        capacity: faker.number.int({ min: 50, max: 500 }),
        price: faker.helpers.arrayElement([0, faker.number.float({ min: 10, max: 100, precision: 0.01 })]).toString(), // Some free, some paid
      });
    }

    const insertedEvents = await db.insert(schema.events).values(eventsData).returning();
    console.log(`Inserted ${insertedEvents.length} events.`);


    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1); // Exit with error
  } finally {
    // Drizzle doesn't require explicit disconnection like some other ORMs
    // You might need db.end() or similar if using node-postgres directly elsewhere
    console.log('Seeding script finished.');
    process.exit(0); // Exit successfully
  }
}

seedDatabase(); 