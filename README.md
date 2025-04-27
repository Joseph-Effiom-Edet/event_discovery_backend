"""# Local Event Finder - Backend

This directory contains the backend API server for the Local Event Finder application. It handles business logic, data storage, user authentication, and serves data to the frontend application.

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Cloning the Repository](#cloning-the-repository)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Database Migrations](#database-migrations)
- [Deployment](#deployment)

## Description

The backend is a Node.js application built with the Express framework. It provides RESTful API endpoints for managing events, users, categories, and bookmarks. It uses PostgreSQL as its primary database and interacts with it via the Drizzle ORM. Authentication is handled using JSON Web Tokens (JWT).

## Tech Stack

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** PostgreSQL
-   **ORM:** Drizzle ORM
-   **Authentication:** JWT (jsonwebtoken), bcrypt (for password hashing)
-   **Dependencies:** `pg`, `cors`, `dotenv`, `body-parser`

## Features

-   User registration and login
-   JWT-based authentication
-   CRUD operations for Events, Categories
-   User bookmarking functionality
-   API endpoint documentation served at the root (`/`)

## Prerequisites

-   Node.js (v18 or later recommended)
-   npm (usually comes with Node.js)
-   Git
-   A running PostgreSQL database instance

## Getting Started

### Cloning the Repository

```bash
# If you haven't already cloned the main project
git clone <repository_url>
cd LocalEventFinder-1/backend
```

### Installation

Install the required dependencies using npm:

```bash
npm install
```

### Database Setup

1.  Ensure you have a PostgreSQL server running.
2.  Create a new database for this application (e.g., `localevents_db`).
3.  Keep the connection details handy (host, port, username, password, database name).

### Environment Variables

The backend requires certain environment variables to connect to the database and configure other settings. Create a `.env` file in the `backend` directory. **Do not commit this file to Git.**

```env
# backend/.env

# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=localevents_db # Or the name you chose

# JWT Secret (Choose a strong, random string)
JWT_SECRET=your_super_secret_jwt_key

# Server Port (Optional, defaults to 8000)
PORT=8000
```

Replace the placeholder values with your actual database credentials and a secure JWT secret.

### Running the Server

**Development Mode (with automatic restarts on file changes):**

```bash
npm run dev
```

**Production Mode:**

```bash
npm start
```

The server should start, and you'll see a message indicating the port it's running on (e.g., `Server running on http://0.0.0.0:8000`).

## API Endpoints

Basic API documentation and a list of endpoints are available by navigating to the root URL (e.g., `http://localhost:8000/`) in your browser when the server is running.

Key endpoint prefixes:
- `/api/auth`: Authentication (register, login)
- `/api/events`: Event management
- `/api/categories`: Category management
- `/api/users`: User information
- `/api/bookmarks`: Bookmark management
- `/health`: Health check

## Database Migrations

This project uses Drizzle ORM and Drizzle Kit for managing the database schema.

To apply the current schema defined in `./shared/schema.ts` to your database (creating tables, columns, etc.), run:

```bash
npm run db:push
```

Ensure your `.env` file is correctly configured before running this command, as it needs to connect to the database.

To generate new migration files based on changes to your schema (though `db:push` is often sufficient for development):

```bash
npm run db:generate
```

## Deployment

This backend application is configured to be deployed on platforms supporting Node.js applications.

**General Steps:**

1.  **Choose a Platform:** Platforms like Render, Railway, Fly.io, or Heroku are suitable.
2.  **Connect Git Repository:** Link your Git repository to the deployment platform.
3.  **Configure Settings:**
    -   **Root Directory:** Set to `backend` (if deploying from the monorepo root).
    -   **Build Command:** `npm install`
    -   **Start Command:** `npm start`
4.  **Set Environment Variables:** Configure the same environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`, `NODE_ENV=production`) in the platform's dashboard using the credentials for your *deployed* database instance.
5.  **Database:** Provision a PostgreSQL database on your chosen platform or use a third-party provider (like Neon, Supabase DB). Ensure the connection details are correctly set in the environment variables.
6.  **Run Migrations:** After the initial deployment, use the platform's console/shell feature to run `npm run db:push` to set up the database schema on the deployment target.

Refer to the specific documentation of your chosen deployment platform for detailed instructions.
"" 