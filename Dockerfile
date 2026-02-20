FROM node:18-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files for the monorepo
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/

# Install all dependencies
RUN npm ci --ignore-scripts

# Copy Prisma schema first
COPY packages/api/prisma ./packages/api/prisma

# Generate Prisma client
RUN cd packages/api && npx prisma generate

# Copy API source code
COPY packages/api ./packages/api

# Build the API
RUN cd packages/api && npm run build

# Expose the port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start the API server
WORKDIR /app/packages/api
CMD ["node", "dist/app.js"]
