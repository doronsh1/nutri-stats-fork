# 🗄️ Database Management Guide

This document explains the database system and migration process for NutriStats.

## Overview

NutriStats uses SQLite as its database with a robust migration system to handle schema changes safely in both development and production environments.

## Database Structure

### Current Tables

#### `users`
- User authentication and profile information
- Created during initial app setup

#### `user_measurements` (v1)
- Stores body measurements (waist, thigh, arm, etc.)
- Fields:
  - `id` - Primary key
  - `user_id` - Foreign key to users table
  - `date` - Measurement date
  - `measurement_type` - Type of measurement (Waist, Thigh, Arm)
  - `value` - Measurement value (decimal)
  - `unit` - Unit of measurement (cm, in)
  - `note` - Optional notes
  - `created_at` - Timestamp when record was created
  - `updated_at` - Timestamp when record was last updated

#### `migration_history` (v2)
- Tracks which database migrations have been executed
- Prevents duplicate migrations and enables rollbacks
- Fields:
  - `id` - Primary key
  - `version` - Migration version number
  - `name` - Migration name
  - `description` - What the migration does
  - `executed_at` - When the migration was run

## Migration System

### How It Works

The migration system uses a version-based approach:

1. **Version Tracking** - Each migration has a unique version number
2. **History Tracking** - All executed migrations are recorded
3. **Incremental Updates** - Only runs new migrations, never duplicates
4. **Rollback Support** - Can undo migrations if needed
5. **Safety Checks** - Dry-run mode to preview changes

### Migration Files

#### Core System
- `src/database/migrations.js` - Migration definitions and execution logic
- `src/database/connection.js` - Database connection management
- `scripts/migrate-database.js` - Command-line migration tool
- `scripts/standalone-migration.js` - Self-contained migration script

#### Available Migrations
- **v1: create_measurements_table** - Creates the user_measurements table
- **v2: create_migration_history** - Creates the migration tracking table

## Running Migrations

### Development Environment

Check migration status:
```bash
node scripts/migrate-database.js --status
```

Preview what will be executed (dry-run):
```bash
node scripts/migrate-database.js --dry-run
```

Run pending migrations:
```bash
node scripts/migrate-database.js
```

### Production Environment

#### Option 1: Via SSH (Recommended)
```bash
# Connect to production server
ssh -i ~/.ssh/your-key user@your-server

# Navigate to project directory
cd /path/to/your/project

# Check status
node scripts/migrate-database.js --status

# Run dry-run first
node scripts/migrate-database.js --dry-run

# Execute migrations
node scripts/migrate-database.js
```

#### Option 2: Standalone Script
If you encounter connection timing issues, use the standalone script:
```bash
# Check status
node scripts/standalone-migration.js /path/to/database.db --status

# Run migrations
node scripts/standalone-migration.js /path/to/database.db
```

#### Option 3: Custom Database Path
```bash
node scripts/migrate-database.js --db-path "/custom/path/to/database.db" --status
```

### Command Options

| Option | Description |
|--------|-------------|
| `--status` | Show current migration status and history |
| `--dry-run` | Preview what would be executed without making changes |
| `--rollback` | Rollback to previous version |
| `--version N` | Target specific version for rollback |
| `--db-path` | Specify custom database file path |
| `--help` | Show help information |

## Safety Features

### Dry-Run Mode
Always test migrations before applying:
```bash
node scripts/migrate-database.js --dry-run
```

### Rollback Support
Undo migrations if needed:
```bash
# Rollback one version
node scripts/migrate-database.js --rollback

# Rollback to specific version
node scripts/migrate-database.js --rollback --version 1
```

### Error Handling
- Migrations stop on first error
- Database remains in consistent state
- Failed migrations don't get recorded as completed
- Detailed error messages for troubleshooting

## Adding New Migrations

### Step 1: Define Migration
Add to `src/database/migrations.js`:
```javascript
{
    version: 3,
    name: 'add_new_feature',
    description: 'Add new feature table',
    up: `
        CREATE TABLE IF NOT EXISTS new_feature (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    `,
    down: `DROP TABLE IF EXISTS new_feature;`
}
```

### Step 2: Test in Development
```bash
node scripts/migrate-database.js --dry-run
node scripts/migrate-database.js
```

### Step 3: Deploy to Production
```bash
# After deploying code changes
node scripts/migrate-database.js --status
node scripts/migrate-database.js --dry-run
node scripts/migrate-database.js
```

## Troubleshooting

### Common Issues

#### "Database not available"
- **Cause**: Connection timing issues
- **Solution**: Use standalone script: `node scripts/standalone-migration.js`

#### "Migration already exists"
- **Cause**: Trying to run completed migration
- **Solution**: Check status with `--status` flag

#### Permission errors
- **Cause**: Insufficient file permissions
- **Solution**: Ensure write access to database file and directory

### Database File Locations

- **Development**: `src/data/nutrition_app.db`
- **Production**: Typically same path on server
- **Custom**: Specify with `--db-path` option

### Backup Recommendations

Before running production migrations:
1. Stop the application
2. Backup the database file
3. Run migration with `--dry-run` first
4. Execute actual migration
5. Verify application functionality
6. Restart application

## Migration History Example

```
📊 Database Migration Status
============================
Current Version: 2

Migration History:
  ✅ v1: create_measurements_table (2025-08-10 14:15:23)
  ✅ v2: create_migration_history (2025-08-10 14:15:23)

✅ Database is up to date
```

## Best Practices

1. **Always run dry-run first** in production
2. **Backup database** before major migrations
3. **Test migrations** in development environment
4. **Use descriptive migration names** and descriptions
5. **Keep migrations small** and focused
6. **Document breaking changes** in migration descriptions
7. **Test rollback procedures** in development

## Support

If you encounter issues with migrations:
1. Check the migration status: `--status`
2. Review error messages carefully
3. Ensure database file permissions are correct
4. Try the standalone migration script
5. Check database file exists and is accessible

For additional help, refer to the application logs and ensure all dependencies (sqlite3) are properly installed.