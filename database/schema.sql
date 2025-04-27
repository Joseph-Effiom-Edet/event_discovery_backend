-- Database schema for Event Discovery Platform

-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    image_url TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    capacity INTEGER,
    price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Registrations table
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'confirmed',
    UNIQUE(user_id, event_id)
);

-- Create Bookmarks table
CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- Create Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for location-based queries
CREATE INDEX events_location_idx ON events (latitude, longitude);

-- Create index for date-based queries
CREATE INDEX events_date_idx ON events (start_date, end_date);

-- Create index for category-based queries
CREATE INDEX events_category_idx ON events (category_id);

-- Create index for event organizer queries
CREATE INDEX events_organizer_idx ON events (organizer_id);

-- Create index for user registrations
CREATE INDEX registrations_user_idx ON registrations (user_id);

-- Create index for event registrations
CREATE INDEX registrations_event_idx ON registrations (event_id);

-- Create index for user bookmarks
CREATE INDEX bookmarks_user_idx ON bookmarks (user_id);

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
('Music', 'Concerts, festivals, and live performances', 'music'),
('Sports', 'Games, tournaments, and athletic events', 'activity'),
('Food & Drink', 'Food festivals, tastings, and culinary experiences', 'coffee'),
('Arts & Culture', 'Museum exhibitions, theater, and cultural celebrations', 'feather'),
('Technology', 'Tech conferences, meetups, and hackathons', 'code'),
('Business', 'Networking events, conferences, and workshops', 'briefcase'),
('Health & Wellness', 'Fitness classes, yoga, and wellness retreats', 'heart'),
('Education', 'Lectures, workshops, and educational seminars', 'book'),
('Community', 'Local gatherings, volunteer opportunities, and social events', 'users'),
('Travel', 'Travel meetups, tours, and adventure events', 'map');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at column
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_categories_timestamp
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_events_timestamp
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
