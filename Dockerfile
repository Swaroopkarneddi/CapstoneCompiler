# Base image with Debian
FROM debian:bullseye

# Install required packages and programming languages
RUN apt-get update && apt-get install -y \
  curl \
  gnupg \
  build-essential \
  g++ \
  python3 \
  python3-pip \
  openjdk-11-jdk \
  nodejs \
  npm

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose server port
EXPOSE 3000

# Start the Node.js server
CMD ["node", "index.js"]
