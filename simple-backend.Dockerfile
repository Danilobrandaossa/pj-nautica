FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY simple-package.json package.json

# Install dependencies
RUN npm install

# Copy server file
COPY simple-server.js .

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
