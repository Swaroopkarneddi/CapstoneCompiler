FROM debian:bullseye

RUN apt-get update && apt-get install -y \
  curl \
  gnupg \
  build-essential \
  g++ \
  python3 \
  python3-pip \
  python-is-python3 \
  openjdk-11-jdk \
  ca-certificates

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && apt-get install -y nodejs

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]


# # Use Debian Bullseye as base image
# FROM debian:bullseye

# # Install required packages
# RUN apt-get update && apt-get install -y \
#   curl \
#   gnupg \
#   build-essential \
#   g++ \
#   python3 \
#   python3-pip \
#   python-is-python3 \
#   openjdk-11-jdk \
#   ca-certificates

# # Install Node.js and npm from NodeSource
# RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
#     apt-get install -y nodejs

# # Create app directory
# WORKDIR /app

# # Copy package.json and package-lock.json (if available) and install dependencies
# COPY package*.json ./
# RUN npm install

# # Copy the rest of the application files
# COPY . .

# # Expose the application port
# EXPOSE 3000

# # Start the application using the defined script
# CMD ["npm", "start"]
