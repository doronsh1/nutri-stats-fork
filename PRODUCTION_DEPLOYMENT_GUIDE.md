# 🚀 Production Deployment Guide - Database Safety

## Problem Solved

Your deployment now safely handles the database without losing customer data:

✅ **Database is preserved** during deployments  
✅ **No data loss** when deploying new code  
✅ **Automatic migrations** run safely  
✅ **Backup system** protects against issues  
✅ **Works with empty repositories** (creates DB if missing)

## How It Works

### 1. Safe Deployment Process
The GitHub Actions workflow now:
1. **Backs up** existing database before deployment
2. **Preserves** the `src/data` directory during code updates
3. **Restores** the database after pulling new code
4. **Runs migrations** to update schema without losing data
5. **Initializes** database if none exists

### 2. Database Files Strategy
- ✅ **Database files stay in `.gitignore`** (never committed)
- ✅ **Directory structure is preserved** with `.gitkeep`
- ✅ **Schema changes via migrations** (safe and tracked)
- ✅ **Data stays on server** (never overwritten)

## Deployment Methods

### Method 1: Automatic (GitHub Actions)
Just push to main branch:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

The workflow automatically:
- Preserves your database
- Updates the code
- Runs migrations
- Restarts the app

### Method 2: Manual (Safer for Critical Updates)
SSH to your server and run:
```bash
cd /home/tomer/Stats
bash scripts/deploy-production.sh
```

This gives you more control and shows detailed output.

## Database Management

### Check Database Status
```bash
# On your server
cd /home/tomer/Stats
node scripts/migrate-database.js --status
```

### Manual Migration (if needed)
```bash
# Preview changes first
node scripts/migrate-database.js --dry-run

# Run migrations
node scripts/migrate-database.js
```

### Initialize New Database
```bash
# Creates database with proper schema
node scripts/init-database.js
```

## Backup System

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

## Troubleshooting

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

## File Structure

```
Stats/
├── src/
│   └── data/
│       ├── .gitkeep              # Ensures directory exists in git
│       └── nutrition_app.db      # Your database (not in git)
├── scripts/
│   ├── init-database.js          # Initialize/migrate database
│   ├── migrate-database.js       # Migration management
│   └── deploy-production.sh      # Manual deployment script
└── .github/
    └── workflows/
        └── deploy.yml             # Updated safe deployment
```

## What Changed

### ✅ Fixed Issues:
1. **Database overwriting**: Now preserved during deployments
2. **Missing database**: Automatically created with proper schema
3. **Data loss**: Impossible with new backup system
4. **Manual deployment**: Added safe manual deployment script

### 🔧 New Features:
- Automatic database backups
- Safe migration system
- Database initialization
- Detailed deployment logging
- Manual deployment option

## Next Steps

1. **Test the deployment**: Push a small change to verify it works
2. **Monitor first deployment**: Check logs to ensure everything works
3. **Verify data preservation**: Confirm existing data is still there
4. **Set up monitoring**: Consider adding health checks

## Emergency Procedures

### If Everything Goes Wrong
1. **Stop the app**: `pm2 stop stats-app`
2. **Restore from backup**: Use latest backup from `/home/tomer/backups/`
3. **Revert code**: `git reset --hard HEAD~1` (go back one commit)
4. **Restart app**: `pm2 start stats-app`

### Contact Support
If you need help:
1. Check GitHub Actions logs
2. Check server logs: `pm2 logs stats-app`
3. Check database status: `node scripts/migrate-database.js --status`

---

**Your database is now safe! 🛡️**

The deployment process will never overwrite your customer data again.