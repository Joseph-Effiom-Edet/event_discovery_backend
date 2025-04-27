require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process'); // Import exec
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
  // Execute the migration command
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
