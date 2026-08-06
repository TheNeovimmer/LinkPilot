# LinkPilot API — multi-stage build
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
# npm workspaces needs every workspace dir to exist; backend/src is not needed for install
RUN mkdir -p backend/src frontend/src
COPY backend/backend 2>/dev/null || true
RUN npm ci

FROM deps AS build
COPY backend backend
COPY frontend frontend
RUN npm run build -w backend

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
WORKDIR /app/backend
EXPOSE 4000
# migrate + optional seed (idempotent), then run
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED\" = \"true\" ]; then npx prisma db seed; fi && node dist/server.js"]
