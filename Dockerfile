# ──── Build ──────────────────────────────────
FROM node:24-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ──── Run ──────────────────────────────────
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY server.mjs ./
# The gRPC client reads the contract at runtime, so the proto files ship
# with the server rather than being looked up in the backend's checkout.
COPY proto ./proto

ENV PORT=3000
ENV SCHEMAFORGE_PROTO_DIR=/app/proto

USER node
EXPOSE 3000

CMD ["node", "server.mjs"]
