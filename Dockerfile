# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# HNX-CIS Frontend — static SPA served by nginx on Cloud Run.
# ---------------------------------------------------------------------------

# ---------- Stage 1: build the Vite bundle ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM nginx:1.27-alpine AS runtime

# Cloud Run overrides PORT; API_BASE_URL is set per environment at deploy time.
ENV PORT=8080 \
    API_BASE_URL="" \
    APP_ENV=production

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/40-generate-env-js.sh /docker-entrypoint.d/40-generate-env-js.sh
RUN rm -f /etc/nginx/conf.d/default.conf \
    && sed -i 's/\r$//' /docker-entrypoint.d/40-generate-env-js.sh \
    && chmod +x /docker-entrypoint.d/40-generate-env-js.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# The nginx base image entrypoint renders the template, runs our env.js script,
# then execs this command.
CMD ["nginx", "-g", "daemon off;"]
