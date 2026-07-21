FROM node:20-bullseye

WORKDIR /app

# Install Xvfb and Playwright system dependencies
RUN apt-get update && apt-get install -y \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Install playwright browsers (chromium only to save space and memory)
# --with-deps will install all necessary linux libraries like libnss3, libxss1, etc.
RUN npx playwright install chromium --with-deps

COPY . .

# Expose port 8080 for Render's health checks and cron ping
EXPOSE 8080

# Start using the pure JS hub
CMD ["node", "src/workers/start.js"]
