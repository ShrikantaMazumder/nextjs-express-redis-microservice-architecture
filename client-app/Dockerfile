# Multi-stage

# Stage 1: Installing dependencies
FROM node:16-alpine AS deps
RUN apk add --no-cache libc6-compact

WORKDIR /app

COPY ./package.json .
COPY ./package-lock.json .

# Stage 2: Building source code
FROM node:16-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Setting up the production image
FROM node:16-alpine 
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
