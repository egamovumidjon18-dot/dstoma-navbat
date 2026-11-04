# Runs DStoma as a normal long-lived Node server on any container host
# (Render, Railway, Fly.io, Cloud Run, a VPS with Docker).
#
#   docker build -t dstoma .
#   docker run -p 3000:3000 --env-file .env dstoma
#
# Needs the environment variables from .env.example; in production
# FIREBASE_SERVICE_ACCOUNT and ADMIN_PASS are required.

FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Builds the web app into dist/ and bundles the server into dist/server.cjs.
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# The server bundle keeps its npm packages external, so they must be installed.
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
