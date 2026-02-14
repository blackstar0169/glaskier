# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build with tsup
RUN npm run build


# ---------- Stage 2: Runtime ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package.json
COPY package*.json ./

# Install production deps only
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy runtime assets if needed
COPY lang ./lang
COPY cache ./cache

# Discord bots don’t expose HTTP ports normally
# so no EXPOSE needed unless you added one

CMD ["node", "--enable-source-maps", "dist/index.js"]
