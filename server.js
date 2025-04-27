require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process'); // Import exec
const { db } = require('./db'); // Import db instance
const { events, users, categories } = require('./shared/schema'); // Import schema tables
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const bookmarkRoutes = require('./routes/bookmarks');
const categoryRoutes = require('./routes/categories');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/categories', categoryRoutes);

// !!! SECURITY WARNING !!!
// This endpoint allows running database migrations via HTTP request.
// It MUST be protected by a strong, secret key (MIGRATE_SECRET env var).
// Remove or disable this endpoint after initial setup.
app.get('/admin/migrate-db', (req, res) => {
  const secret = req.query.secret;

  if (!process.env.MIGRATE_SECRET) {
    console.error('MIGRATE_SECRET environment variable is not set.');
    return res.status(500).send('Migration endpoint not configured correctly (missing secret).');
  }

  if (secret !== process.env.MIGRATE_SECRET) {
    console.warn('Unauthorized migration attempt detected.');
    return res.status(403).send('Forbidden: Invalid secret.');
  }

  console.log('Migration requested via endpoint with valid secret. Executing...');
  // Execute the migration command (using the updated script name)
  exec('npm run db:push', { env: process.env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Migration Error: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).send(`Migration failed:\nError: ${error.message}\nStderr: ${stderr}\nStdout: ${stdout}`);
    }
    if (stderr) {
      // Drizzle often logs to stderr even on success, check stdout too
      console.warn(`Migration Stderr: ${stderr}`);
    }
    console.log(`Migration Stdout: ${stdout}`);
    res.status(200).send(`Migration process finished.\nStdout:\n${stdout}\nStderr:\n${stderr}`);
  });
});

// !!! SECURITY WARNING !!!
// This endpoint allows seeding the database with sample event and category data.
// It MUST be protected by a strong, secret key (MIGRATE_SECRET env var).
// Remove or disable this endpoint after initial setup.
app.get('/admin/seed-events', async (req, res) => {
  const secret = req.query.secret;

  if (!process.env.MIGRATE_SECRET) {
    console.error('MIGRATE_SECRET environment variable is not set.');
    return res.status(500).send('Seeding endpoint not configured correctly (missing secret).');
  }

  if (secret !== process.env.MIGRATE_SECRET) {
    console.warn('Unauthorized seeding attempt detected.');
    return res.status(403).send('Forbidden: Invalid secret.');
  }

  console.log('Seeding requested via endpoint with valid secret. Executing...');

  try {
    // ----- 1. Seed Categories ----- 
    console.log('Seeding categories...');
    const sampleCategories = [
      { name: 'Technology', description: 'Events related to tech, startups, and innovation.', icon: '💻' },
      { name: 'Music', description: 'Concerts, festivals, and live music performances.', icon: '🎵' },
      { name: 'Arts & Culture', description: 'Exhibitions, fairs, theatre, and cultural events.', icon: '🎨' },
      { name: 'Food & Drink', description: 'Food festivals, tastings, and culinary experiences.', icon: '🍔' },
      { name: 'Business & Networking', description: 'Conferences, workshops, and networking events.', icon: '💼' },
      { name: 'Sports & Fitness', description: 'Sporting events, competitions, and fitness activities.', icon: '⚽' },
      { name: 'Community', description: 'Local gatherings, markets, and community events.', icon: '🤝' }
    ];

    // Insert categories and get their IDs
    const insertedCategories = await db.insert(categories).values(sampleCategories).onConflictDoNothing().returning({ id: categories.id });
    console.log(`Inserted ${insertedCategories.length} new categories.`);

    // Fetch all category IDs (including potentially existing ones + newly inserted)
    const allCategoryIds = (await db.select({ id: categories.id }).from(categories)).map(c => c.id);
    if (allCategoryIds.length === 0) {
        return res.status(500).send('Failed to insert or find any categories.');
    }
    console.log(`Found ${allCategoryIds.length} total categories.`);

    // ----- 2. Fetch Organizer User ----- 
    console.log('Fetching organizer user...');
    const [firstUser] = await db.select().from(users).limit(1);

    if (!firstUser) {
      return res.status(400).send('Error: Could not find any user in the database. Please create at least one user before seeding events.');
    }
    const organizerId = firstUser.id;
    console.log(`Using User ID ${organizerId} as organizer.`);

    // ----- 3. Generate and Seed Events ----- 
    console.log('Generating sample events...');
    const now = new Date();
    const sampleEventsData = [];
    const locations = [
        { name: 'Eko Hotels & Suites, Lagos', lat: 6.4284, lon: 3.4214 },
        { name: 'Transcorp Hilton Abuja, Maitama', lat: 9.0728, lon: 7.4913 },
        { name: 'Hotel Presidential, Port Harcourt', lat: 4.8156, lon: 7.0498 },
        { name: 'University of Ibadan Conference Centre', lat: 7.4450, lon: 3.8980 },
        { name: 'Landmark Centre, Lagos', lat: 6.4309, lon: 3.4247 },
        { name: 'Nike Art Gallery, Lagos', lat: 6.4373, lon: 3.4837 },
        { name: 'Millennium Park, Abuja', lat: 9.0651, lon: 7.4854 },
        { name: 'Freedom Park, Lagos', lat: 6.4510, lon: 3.3999 },
        { name: 'Kano Pillars Stadium, Kano', lat: 11.9658, lon: 8.5152 },
        { name: 'Oniru Beach Resort, Lagos', lat: 6.4240, lon: 3.4635 },
        { name: 'Calabar International Convention Centre', lat: 4.9700, lon: 8.3448 },
        { name: 'Abeokuta Centenary Hall', lat: 7.1554, lon: 3.3458 },
        { name: 'Jos Wildlife Park', lat: 9.8560, lon: 8.8910 },
        { name: 'New Afrika Shrine, Ikeja, Lagos', lat: 6.6116, lon: 3.3536 },
        { name: 'National Theatre, Iganmu, Lagos', lat: 6.4735, lon: 3.3705 }
    ];
    const eventTitles = [
        'Innovate Nigeria Conference', 'Afrobeat Nights Live', 'Contemporary Art Expo', 'Naija Food Fest', 'Startup Pitch Competition', 
        'Lagos City Marathon', 'Community Cleanup Drive', 'Tech Skills Workshop', 'Jazz Under the Stars', 'Local Farmers Market', 
        'African Fashion Week', 'Indie Film Screening', 'Book Reading & Signing', 'Photography Masterclass', 'Digital Marketing Summit',
        'Yoga in the Park', 'Open Mic Poetry Night', 'Cultural Heritage Day', 'Gaming Tournament', 'Charity Gala Dinner'
    ];

    for (let i = 0; i < 20; i++) {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      const randomCategory = allCategoryIds[Math.floor(Math.random() * allCategoryIds.length)];
      const startDate = new Date(now.getTime() + (Math.random() * 30 + 1) * 24 * 60 * 60 * 1000); // 1-30 days from now
      const endDate = new Date(startDate.getTime() + (Math.random() * 6 + 2) * 60 * 60 * 1000); // 2-8 hours long

      sampleEventsData.push({
        title: eventTitles[i % eventTitles.length] + (i >= eventTitles.length ? ` #${Math.floor(i/eventTitles.length)+1}` : ''), // Ensure unique title
        description: `Join us for the exciting ${eventTitles[i % eventTitles.length]} event at ${randomLocation.name}. More details to come!`,
        location: randomLocation.name,
        latitude: randomLocation.lat.toFixed(8),
        longitude: randomLocation.lon.toFixed(8),
        start_date: startDate,
        end_date: endDate,
        image_url: `https://picsum.photos/seed/event${i + Date.now()}/800/600`, // Unique placeholder image using timestamp
        category_id: randomCategory,
        organizer_id: organizerId,
        capacity: Math.floor(Math.random() * 450) + 50, // 50-500 capacity
        price: (Math.random() < 0.3) ? '0.00' : (Math.random() * 10000 + 1000).toFixed(2) // ~30% free, else 1000-11000 Naira
      });
    }

    // Insert the events
    console.log('Inserting events...');
    const insertedEvents = await db.insert(events).values(sampleEventsData).returning();

    console.log(`Successfully seeded ${insertedCategories.length} categories and ${insertedEvents.length} events.`);
    res.status(200).send(`Seeding complete. Added ${insertedCategories.length} categories and ${insertedEvents.length} events.`);

  } catch (error) {
    console.error('Seeding Error:', error);
    res.status(500).send(`Seeding failed: ${error.message}`);
  }
});

// Root route - API documentation
app.get('/', (req, res) => {
  res.status(200).send(`
    <html>
      <head>
        <title>Event Discovery API</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          h2 { color: #444; margin-top: 30px; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          .endpoint { margin-bottom: 15px; }
          .method { font-weight: bold; color: #0066cc; }
        </style>
      </head>
      <body>
        <h1>Event Discovery Platform API</h1>
        <p>Welcome to the Event Discovery Platform API. Below are the available endpoints:</p>
        
        <h2>Categories</h2>
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/categories</code> - Get all categories</p>
        </div>
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/categories/:id</code> - Get a specific category</p>
        </div>
        <div class="endpoint">
          <p><span class="method">POST</span> <code>/api/categories</code> - Create a new category</p>
        </div>
        <div class="endpoint">
          <p><span class="method">PUT</span> <code>/api/categories/:id</code> - Update a category</p>
        </div>
        <div class="endpoint">
          <p><span class="method">DELETE</span> <code>/api/categories/:id</code> - Delete a category</p>
        </div>
        
        <h2>Events</h2>
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/events</code> - Get all events</p>
        </div>
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/events/:id</code> - Get a specific event</p>
        </div>
        
        <h2>Authentication</h2>
        <div class="endpoint">
          <p><span class="method">POST</span> <code>/api/auth/register</code> - Register a new user</p>
        </div>
        <div class="endpoint">
          <p><span class="method">POST</span> <code>/api/auth/login</code> - Login as a user</p>
        </div>
        
        <h2>Bookmarks</h2>
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/api/bookmarks</code> - Get user's bookmarks</p>
        </div>
        
        <h2>Health Check</h2>
        <div class="endpoint">
          <p><span class="method">GET</span> <code>/health</code> - API health status</p>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});


// Start the server -- Vercel handles this
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});


module.exports = app;
