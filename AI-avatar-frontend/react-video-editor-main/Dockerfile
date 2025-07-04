# Use Node.js 22 as the base image
FROM node:22.14.0-alpine

# Set working directory
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Copy package manager files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy rest of the application
COPY . .

# Build the app
RUN pnpm run build

# Expose the Vite dev server port
EXPOSE 5173

# Start the Vite dev server in host mode
CMD ["pnpm", "dev", "--host"]
