# Use an official Node.js runtime as a parent image
# Using Alpine Linux for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) before other files
# Leverage Docker cache to speed up builds when dependencies haven't changed
COPY package*.json ./

# Install app dependencies
# Using --only=production to avoid installing devDependencies
RUN npm install --only=production --no-optional && npm cache clean --force

# Bundle app source inside Docker image
COPY . .

# Get the port from the environment variable, default to 3000 if not set
# Make sure your backend listens on the port defined by the PORT environment variable
ENV PORT=3000

# Expose the port the app runs on
EXPOSE $PORT

# Define the command to run the app
# This assumes your package.json has a "start" script, e.g., "start": "node server.js"
# If not, you might use: CMD ["node", "server.js"]
CMD ["npm", "start"] 