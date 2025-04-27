import { defineConfig } from 'drizzle-kit';
import 'dotenv/config'; // Ensure environment variables are loaded

if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_DATABASE) {
  throw new Error('Database credentials are not set in the environment variables');
}

export default defineConfig({
  dialect: 'postgresql', // Specify the dialect
  schema: './shared/schema.ts', // Point to your schema file
  out: './drizzle', // Directory to output migration files (though push doesn't strictly need it)
  dbCredentials: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: false, // Explicitly disable SSL for local connection
  },
  // Enable verbose logging
  verbose: true,
  // Disable strict mode for potentially easier pushing in development
  strict: false,
}); 