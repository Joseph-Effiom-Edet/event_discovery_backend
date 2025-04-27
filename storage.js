'use strict';

// Assuming schema.js exists or will be created in backend/shared/
const { users } = require("./shared/schema"); 
const { db } = require("./db");
const { eq } = require("drizzle-orm");

// Class implementing storage operations
class DatabaseStorage {
  async getUser(id) {
    // Drizzle methods like select(), from(), where() return promises
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0]; // Return the first user found, or undefined if empty
  }

  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser) {
    // .returning() ensures the inserted user data is returned
    const result = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return result[0]; // Return the newly created user
  }
}

// Export a single instance of the storage class
const storage = new DatabaseStorage();

module.exports = { storage }; 