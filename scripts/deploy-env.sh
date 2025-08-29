#!/bin/bash
# Deployment script that creates .env file from environment variables

echo "Creating .env file from environment variables..."

cat > .env << EOF
DB_TYPE=${DB_TYPE:-sqlite}
DB_PATH=${DB_PATH:-./src/data/nutrition_app.db}
NODE_ENV=${NODE_ENV:-production}

SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

ADMIN_EMAIL=${ADMIN_EMAIL}
EMAIL_FROM=${EMAIL_FROM}
EOF

echo ".env file created successfully"