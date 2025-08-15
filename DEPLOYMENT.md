# 🚀 Production Deployment Guide

This guide explains how to safely deploy to production without losing customer data.

## Problem Solved ✅

Your deployment now safely handles the database:
- **Database is preserved** during deployments  
- **No data loss** when deploying new code  
- **Automatic migrations** run safely  
- **Backup system** protects against issues  
- **Works with empty repositories** (creates DB if missing)

## 🚀 Quick Deployment

### Method 1: Automatic (Recommended)
Just push to main branch:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

The GitHub Actions workflow automatically:
- Preserves your database
- Updates the code  
- Runs migrations
- Restarts the app

### Method 2: Manual (For Critical Updates)
SSH to your server and run:
```bash
cd /home/tomer/Stats
bash scripts/deploy-production.sh
```

## How It Works

### Safe Deployment Process
The GitHub Actions workflow:
1. **Backs up** existing database before deployment
2. **Preserves** the `src/data` directory during code updates  
3. **Restores** the database after pulling new code
4. **Runs migrations** to update schema without losing data
5. **Initializes** database if none exists

### Database Strategy
- ✅ **Database files stay in `.gitignore`** (never committed)
- ✅ **Directory structure preserved** with `.gitkeep`
- ✅ **Schema changes via migrations** (safe and tracked)
- ✅ **Data stays on server** (never overwritten)

## 📋 Database Migration System

### Migration Commands

```bash
# Check migration status
node scripts/migrate-database.js --status

# Preview migrations (dry run)
node scripts/migrate-database.js --dry-run

# Run pending migrations
node scripts/migrate-database.js

# Initialize new database
node scripts/init-database.js

# Rollback to previous version
node scripts/migrate-database.js --rollback

# Rollback to specific version
node scripts/migrate-database.js --rollback --version 1
```

## 🗄️ Current Migrations

### Migration 1: Measurements Table
- **Description**: Creates the `user_measurements` table for body measurements tracking
- **Tables Added**: `user_measurements`
- **Data Impact**: None (only adds new functionality)

### Migration 2: Migration History
- **Description**: Creates the `migration_history` table to track applied migrations
- **Tables Added**: `migration_history`
- **Data Impact**: None (system table)

## 🔒 Safety Features

### Automatic Backups
The system automatically creates backups before major operations:
```bash
# Manual backup
cp src/data/nutrition_app.db src/data/nutrition_app.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Dry Run Mode
Always test migrations first:
```bash
node scripts/migrate-database.js --dry-run
```

### Rollback Capability
If something goes wrong, rollback:
```bash
node scripts/migrate-database.js --rollback
```

## 📊 Measurements Feature

### New API Endpoints
```
GET    /api/measurements           # Get all measurements
GET    /api/measurements/types     # Get measurement types
GET    /api/measurements/type/:type # Get measurements by type
GET    /api/measurements/stats/:type # Get statistics
POST   /api/measurements           # Add measurement
PUT    /api/measurements/:id       # Update measurement
DELETE /api/measurements/:id       # Delete measurement
```

### Database Schema
```sql
CREATE TABLE user_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    measurement_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'cm',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## 🚀 Production Deployment Steps

### Step 1: Pre-Deployment Checks
```bash
# Check current application status
pm2 status

# Check database file permissions
ls -la src/data/nutrition_app.db

# Check available disk space
df -h
```

### Step 2: Backup Current State
```bash
# Create timestamped backup
BACKUP_NAME="nutrition_app.db.backup.$(date +%Y%m%d_%H%M%S)"
cp src/data/nutrition_app.db "src/data/$BACKUP_NAME"
echo "Backup created: $BACKUP_NAME"
```

### Step 3: Deploy Code Changes
```bash
# Pull latest code
git pull origin main

# Install any new dependencies
npm install

# Check migration status
node scripts/migrate-database.js --status
```

### Step 4: Run Migrations
```bash
# Dry run first
node scripts/migrate-database.js --dry-run

# If dry run looks good, run migrations
node scripts/migrate-database.js
```

### Step 5: Restart Application
```bash
# Restart with your process manager
pm2 restart nutristats

# Or if using systemd
sudo systemctl restart nutristats

# Or if running directly
# Kill existing process and restart
```

### Step 6: Verify Deployment
```bash
# Check application logs
pm2 logs nutristats

# Test new endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/measurements/types

# Check migration status
node scripts/migrate-database.js --status
```

## 🛡️ Backup System

### Automatic Backups
- Created before each deployment
- Stored in `/home/tomer/backups/`
- Timestamped for easy identification

### Manual Backup
```bash
# Create manual backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp src/data/nutrition_app.db "/home/tomer/backups/nutrition_app.db.manual.$TIMESTAMP"
```

### Restore from Backup
```bash
# Stop app first
pm2 stop stats-app

# Restore backup (replace TIMESTAMP with actual timestamp)
cp "/home/tomer/backups/nutrition_app.db.backup.TIMESTAMP" src/data/nutrition_app.db

# Start app
pm2 start stats-app
```

## 🔧 Troubleshooting

### If Deployment Fails
1. **Check the logs**: GitHub Actions will show detailed error messages
2. **SSH to server**: Check what happened manually
3. **Restore backup**: Use the automatic backup created before deployment

### If Database is Missing
The system will automatically create a new database with proper schema.

### If App Won't Start
```bash
# Check logs
pm2 logs stats-app

# Check database
node scripts/migrate-database.js --status

# Restart app
pm2 restart stats-app
```

### Emergency Procedures
If everything goes wrong:
1. **Stop the app**: `pm2 stop stats-app`
2. **Restore from backup**: Use latest backup from `/home/tomer/backups/`
3. **Revert code**: `git reset --hard HEAD~1` (go back one commit)
4. **Restart app**: `pm2 start stats-app`

## 📈 Monitoring

### Database Size
```bash
# Check database size
ls -lh src/data/nutrition_app.db

# Check table sizes
sqlite3 src/data/nutrition_app.db "
SELECT name, COUNT(*) as rows 
FROM sqlite_master 
JOIN (
    SELECT 'users' as name, COUNT(*) as count FROM users
    UNION SELECT 'user_weight', COUNT(*) FROM user_weight
    UNION SELECT 'user_measurements', COUNT(*) FROM user_measurements
) ON sqlite_master.name = name
WHERE type='table';
"
```

### Performance
```bash
# Check application performance
pm2 monit

# Check database performance
sqlite3 src/data/nutrition_app.db "PRAGMA optimize;"
```

## 🔄 Rollback Procedure

If you need to rollback the measurements feature:

```bash
# 1. Rollback database migrations
node scripts/migrate-database.js --rollback --version 0

# 2. Revert code changes
git revert HEAD  # or checkout previous version

# 3. Restart application
pm2 restart nutristats

# 4. Verify rollback
node scripts/migrate-database.js --status
```

## 📞 Support

If you encounter issues during deployment:

1. **Check the logs**: `pm2 logs nutristats`
2. **Verify migration status**: `node scripts/migrate-database.js --status`
3. **Test database connectivity**: Try accessing existing features
4. **Restore from backup if needed**: `cp backup_file src/data/nutrition_app.db`

## ✅ Post-Deployment Checklist

- [ ] Database migrations completed successfully
- [ ] Application restarted without errors
- [ ] Existing features still work (login, weight tracking, etc.)
- [ ] New measurements tab appears in Reports
- [ ] Can create measurement entries
- [ ] Can view measurement statistics and charts
- [ ] API endpoints respond correctly
- [ ] No JavaScript errors in browser console
- [ ] Database backup created and stored safely

---

**Remember**: Always test in a staging environment first, and keep backups of your production database!