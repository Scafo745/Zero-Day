# ==============================================================================
# ZeroTrace Frontend — Next.js 15 Multi-stage Dockerfile
# Build context: Repository root
# Usage: docker build -t zerotrace-frontend -f frontend/Dockerfile .
# ==============================================================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps

WORKDIR /app

# Copy shared types needed by TypeScript
COPY packages/shared/ ./packages/shared/

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY packages/shared/ ./packages/shared/

WORKDIR /app/frontend
COPY --from=deps /app/frontend/node_modules ./node_modules
COPY frontend/ ./

ARG NEXT_PUBLIC_API_URL=http://localhost:5001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app/frontend

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files
COPY --from=builder /app/frontend/package.json ./package.json
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public

USER node

EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
