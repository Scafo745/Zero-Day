# ==============================================================================
# ZeroTrace Backend — Multi-stage Dockerfile
# Build context: Repository root
# Usage: docker build -t zerotrace-backend -f backend/Dockerfile .
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root-level dependencies & shared contracts
COPY packages/shared/ ./packages/shared/
COPY agent/ ./agent/

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json backend/tsconfig.json ./
RUN npm ci

# Copy backend source code & build
COPY backend/src/ ./src/
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001
ENV LLM_MODE=auto
ENV OLLAMA_HOST=http://host.docker.internal:11434
ENV OLLAMA_MODEL=zerotrace-analyst
ENV FRONTEND_ORIGIN=http://localhost:3000

# Copy agent prompts and schemas for runtime model analysis
COPY --from=builder /app/agent ./agent

WORKDIR /app/backend

# Copy production dependencies & built artifacts
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist

# Non-root user for security
USER node

EXPOSE 5001

CMD ["node", "dist/backend/src/server.js"]
