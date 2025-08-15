#!/bin/bash

# Production Deployment Script
# This script can be run manually on the production server for safer deployments

set -e  # Exit on any error

echo "🚀 NutriStats Production Deployment"
echo "==================================="

# Configuration
PROJECT_DIR="/home/tomer/Stats"
BACKUP_DIR="/home/tomer/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup..."
if [ -f "$PROJECT_DIR/src/data/nutrition_app.db" ]; then
    cp "$PROJECT_DIR/src/data/nutrition_app.db" "$BACKUP_DIR/nutrition_app.db.backup.$TIMESTAMP"
    echo "✅ Database backed up to: $BACKUP_DIR/nutrition_app.db.backup.$TIMESTAMP"
else
    echo "ℹ️  No existing database found"
fi

# Stop the application
echo "🛑 Stopping application..."
pm2 stop stats-app || echo "Application was not running"

# Backup current data
echo "🗂️ Preserving data directory..."
TEMP_DATA_DIR="/tmp/stats_data_backup_$TIMESTAMP"
mkdir -p "$TEMP_DATA_DIR"
if [ -d "$PROJECT_DIR/src/data" ]; then
    cp -r "$PROJECT_DIR/src/data"/* "$TEMP_DATA_DIR/" 2>/dev/null || true
fi

# Pull latest code
echo "📥 Updating code..."
cd "$PROJECT_DIR"
git fetch origin
git reset --hard origin/main

# Restore data
echo "🔄 Restoring data..."
mkdir -p "$PROJECT_DIR/src/data"
if [ -d "$TEMP_DATA_DIR" ]; then
    cp -r "$TEMP_DATA_DIR"/* "$PROJECT_DIR/src/data/" 2>/dev/null || true
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run database migrations
echo "🗄️ Running database migrations..."
node scripts/init-database.js

# Start application
echo "🚀 Starting application..."
pm2 start npm --name stats-app -- start || pm2 restart stats-app

# Cleanup
rm -rf "$TEMP_DATA_DIR"

echo "✅ Deployment completed successfully!"
echo "📊 Application status:"
pm2 status stats-app

echo ""
echo "🔍 To verify deployment:"
echo "  - Check logs: pm2 logs stats-app"
echo "  - Check database: node scripts/migrate-database.js --status"
echo "  - Test application: curl http://localhost:8080/health"