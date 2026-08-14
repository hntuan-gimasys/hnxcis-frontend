#!/bin/sh
# Regenerates /env.js on every container start so the SPA picks up the backend
# URL from the Cloud Run environment instead of from the build.
#
# Cloud Run:  gcloud run services update hnxcis-frontend \
#               --set-env-vars API_BASE_URL=https://hnxcis-backend-xxxx.a.run.app
set -eu

TARGET="/usr/share/nginx/html/env.js"
API_BASE_URL="${API_BASE_URL:-}"
APP_ENV="${APP_ENV:-production}"

# Strip a trailing slash so the app can concatenate "/api/..." safely.
API_BASE_URL="${API_BASE_URL%/}"

cat > "$TARGET" <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}",
  APP_ENV: "${APP_ENV}"
};
EOF

echo "[entrypoint] wrote $TARGET (API_BASE_URL='${API_BASE_URL}', APP_ENV='${APP_ENV}')"
