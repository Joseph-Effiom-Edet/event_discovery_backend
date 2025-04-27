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
  - [Running with Docker](#running-with-docker)
- [API Endpoints](#api-endpoints)
- [Database Migrations](#database-migrations)
- [Deployment](#deployment)

## Description

The backend is a Node.js application built with the Express framework. It provides RESTful API endpoints for managing events, users, categories, and bookmarks. It uses PostgreSQL as its primary database and interacts with it via the Drizzle ORM. Authentication is handled using JSON Web Tokens (JWT). This backend is designed to be run directly using Node.js or as a Docker container.

## Tech Stack

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** PostgreSQL
-   **ORM:** Drizzle ORM
-   **Authentication:** JWT (jsonwebtoken), bcrypt (for password hashing)
-   **Containerization:** Docker
-   **Dependencies:** `pg`, `cors`, `dotenv`, `body-parser`

## Features

-   User registration and login
-   JWT-based authentication
-   CRUD operations for Events, Categories
-   User bookmarking functionality
-   API endpoint documentation served at the root (`/`)
-   Docker support for consistent development and deployment

## Setup Instructions

_TODO: Add detailed setup instructions here, perhaps referencing the 'Getting Started' section or adding specific steps._

## Architectural Decisions

_TODO: Briefly explain key architectural choices:_
- _Why Express?_
- _Why Drizzle ORM?_
- _Why JWT for authentication?_
- _Why PostgreSQL?_
- _Approach to structuring routes/controllers/services (if applicable)._

## Assumptions or Limitations

_TODO: List any assumptions made during development or known limitations:_
- _Example: Assumes a specific version of Node.js._
- _Example: Limited error handling for certain edge cases._
- _Example: No real-time features implemented._
- _Example: Security considerations (e.g., rate limiting not implemented)._

## Future Improvements

_TODO: Outline potential future enhancements:_
- _Example: Implement more robust testing (unit, integration)._
- _Example: Add caching mechanisms._
- _Example: Implement role-based access control._
- _Example: Enhance API documentation (e.g., using Swagger/OpenAPI)._
- _Example: Add support for image uploads for events._

## Prerequisites

-   Node.js (v18 or later recommended)
-   npm (usually comes with Node.js)
-   Git
-   A running PostgreSQL database instance (required for direct Node.js run and migrations)
-   Docker and Docker Compose (optional, for running via Docker)

## Getting Started

### Cloning the Repository

```bash
# If you haven't already cloned the main project
git clone <repository_url>
cd LocalEventFinder-1/backend
```

### Installation (For Direct Node.js Usage)

Install the required dependencies using npm:

```bash
npm install
```

### Database Setup

1.  Ensure you have a PostgreSQL server running (locally or remotely).
2.  Create a new database for this application (e.g., `localevents_db`).
3.  Keep the connection details handy (host, port, username, password, database name).

### Environment Variables

The backend requires certain environment variables to connect to the database and configure other settings. Create a `.env` file in the `backend` directory. **Do not commit this file to Git.**

```env
# backend/.env

# Database Connection (Replace with your actual connection details)
# Example for local PostgreSQL:
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=localevents_db

# Example DATABASE_URL (some services like Render or Docker Compose might prefer this format):
# DATABASE_URL=postgres://your_postgres_user:your_postgres_password@localhost:5432/localevents_db
# Note: The application currently uses individual DB_* variables from db.js.
# Ensure these match your DATABASE_URL if using both.

# JWT Secret (Choose a strong, random string)
JWT_SECRET=your_super_secret_jwt_key

# Server Port (Optional, defaults to value in server.js, Dockerfile sets to 3000)
# PORT=8000
```

Replace the placeholder values with your actual database credentials and a secure JWT secret.

### Running the Server (Directly with Node.js)

**Development Mode (with automatic restarts on file changes):**

```bash
# Ensure your .env file is configured
npm run dev
```

**Production Mode:**

```bash
# Ensure your .env file is configured
npm start
```

The server should start, and you'll see a message indicating the port it's running on (e.g., `Server running on http://0.0.0.0:8000`).

### Running with Docker

The backend includes a `Dockerfile` for containerized deployment.

**Build the Docker Image:**

```bash
# Run from the LocalEventFinder-1/backend directory
docker build -t localeventfinder-backend .
```

**Run the Docker Container:**

You need to provide the necessary environment variables to the container at runtime. Create a file named `docker.env` (or similar, ensure it's in `.gitignore` or `.dockerignore`) in the `backend` directory with the same content as your `.env` file, but adjust `DB_HOST` if your database is running outside Docker (e.g., use `host.docker.internal` on Docker Desktop, or the host IP).

```env
# backend/docker.env

DB_HOST=host.docker.internal # Or your DB host IP if not running Docker Compose
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=localevents_db

JWT_SECRET=your_super_secret_jwt_key

# PORT will be 3000 inside the container as per Dockerfile
```

Then run the container, mapping the internal port (3000) to a host port (e.g., 8000) and passing the environment variables:

```bash
# Run from the LocalEventFinder-1/backend directory
docker run --env-file docker.env -p 8000:3000 --name eventfinder-be localeventfinder-backend
```

The backend API should now be accessible on `http://localhost:8000`.

**Note:** For a more robust local Docker setup involving both the backend and a database, consider using Docker Compose.

## API Endpoints

Basic API documentation and a list of endpoints are available by navigating to the root URL (e.g., `http://localhost:8000/` when running via Node or Docker) in your browser when the server is running.

Key endpoint prefixes:
- `/api/auth`: Authentication (register, login)
- `/api/events`: Event management
- `/api/categories`: Category management
- `/api/users`: User information
- `/api/bookmarks`: Bookmark management
- `/health`: Health check

## Database Migrations

This project uses Drizzle ORM and Drizzle Kit for managing the database schema.

**Running Migrations (Directly with Node.js):**

Ensure your `.env` file is correctly configured with database credentials. Then, run:

```bash
npm run db:push
```

**Running Migrations (When Using Docker):**

If your backend is running in a Docker container, you need to execute the migration command *inside* the running container:

```bash
# Find your running container name (e.g., eventfinder-be)
docker ps

# Execute the migration command inside the container
docker exec -it eventfinder-be npm run db:push
```

To generate new migration files based on changes to your schema (though `db:push` is often sufficient for development):

```bash
# Run directly with Node.js
npm run db:generate

# Or inside the Docker container
docker exec -it eventfinder-be npm run db:generate
```

## Deployment (Render with Docker)

This backend is configured for deployment to Render using Docker.

1.  **Push to GitHub:** Ensure `backend/Dockerfile` and `backend/.dockerignore` are committed and pushed to your GitHub repository.
2.  **Render Service Configuration:**
    -   Navigate to your Web Service on Render.
    -   Go to **Settings** > **Build & Deploy**.
    -   Set **Runtime** to **Docker**.
    -   Set **Dockerfile Path** to `backend/Dockerfile`.
    -   Set **Build Context Directory** to `backend`.
    -   Save changes.
3.  **Environment Variables:**
    -   Go to the **Environment** section for your Render service.
    -   Ensure you have an environment variable group linked or variables set for:
        -   `DATABASE_URL`: Render should provide this automatically if you linked a Render PostgreSQL database. The application needs to be able to parse this or have the individual `DB_*` variables set.
        -   `JWT_SECRET`: Set a strong, unique secret for the production environment.
        -   `NODE_ENV`: Set to `production`.
        -   *(Optional)* `PORT`: Render sets this automatically; the Dockerfile uses it.
    -   **Crucially:** Verify that the application logic in `db.js` correctly prioritizes `DATABASE_URL` or uses the `DB_*` variables set in the Render environment. If using individual `DB_*` variables, make sure they match the credentials of your Render PostgreSQL instance.
4.  **Database Migrations:**
    -   After a successful deployment, connect to your service using Render's **Shell** tab.
    -   Run the database migration command inside the shell: `npm run db:push`
5.  **Trigger Deployment:** Deploy the latest commit manually or rely on auto-deploy if configured.
"" 