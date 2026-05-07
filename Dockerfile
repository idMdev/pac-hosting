# ---------- Stage 1: build the admin UI ----------
FROM node:18-alpine AS ui-builder

WORKDIR /ui

# Install UI dependencies
COPY admin-ui/package*.json admin-ui/bun.lockb* ./
RUN npm install --no-audit --no-fund

# Copy UI source and build
COPY admin-ui/ ./
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:18-alpine

WORKDIR /app

# Install server production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy server source
COPY . .

# Drop the unbuilt admin-ui source from the image and copy in the built dist
RUN rm -rf /app/admin-ui
COPY --from=ui-builder /ui/dist /app/admin-ui/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001 \
 && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "server.js"]
