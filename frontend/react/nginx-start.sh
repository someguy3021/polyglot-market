#!/bin/sh
# runtime-подстановка API_URL (ADR-007): пишет /config.js, который index.html
# подключает до бандла; приложение читает window.API_URL.
cat > /usr/share/nginx/html/config.js << EOF
window.API_URL = "${API_URL:-http://localhost:8000}";
EOF
