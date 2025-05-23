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

// !!! SECURITY WARNING !!! - REMOVED MIGRATION ENDPOINT
// app.get('/admin/migrate-db', (req, res) => { ... });

// !!! SECURITY WARNING !!! - REMOVED SEEDING ENDPOINT
// app.get('/admin/seed-events', async (req, res) => { ... });

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
