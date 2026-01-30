# Base on official Node.js Alpine image or one with required libs
# Since Puppeteer needs Chrome, allow it to install via apt-get or use specific puppeteer image
FROM node:18-bullseye-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Env vars
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    NODE_ENV=production

WORKDIR /app

# Install dependencies (only production if possible, but Next.js build needs devDependencies sometimes)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build Next.js
RUN npm run build
# Compile server.ts to dist (using tsc or ts-node in runtime)
# Simplest: use ts-node in production or precompile. 
# Let's precompile server.ts
RUN npx tsc server.ts --esModuleInterop --outDir dist

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/server.js"]
