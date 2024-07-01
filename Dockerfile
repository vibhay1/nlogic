# Use the official Node.js image as the base image
FROM node:18

# Create and change to the app directory
WORKDIR /app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the local code to the container image
COPY . .

# Run the application
CMD ["npm", "start"]