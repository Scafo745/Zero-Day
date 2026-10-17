# ==============================================================================
# ZeroTrace Backend — Production Dockerfile
# Self-contained for Render, Railway, Fly.io, or Local Docker builds
# ==============================================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

# Copy agent prompts and source code
COPY agent/ ./agent/
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001
ENV LLM_MODE=auto
ENV OLLAMA_HOST=http://host.docker.internal:11434
ENV OLLAMA_MODEL=zerotrace-analyst
ENV FRONTEND_ORIGIN=*

# Copy built code and dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/agent ./agent

USER node

EXPOSE 5001

CMD ["node", "dist/server.js"]
