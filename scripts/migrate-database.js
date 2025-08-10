#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script can be run in production to safely update the database schema
 * without overwriting existing data.
 * 
 * Usage:
 *   node scripts/migrate-database.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be done without executing
 *   --rollback   Rollback to previous version
 *   --version    Target version (for rollback)
 *   --status     Show current migration status
 */

const path = require('path');
const fs = require('fs');

// Add the src directory to the path so we can import our modules
const srcPath = path.join(__dirname, '..', 'src');
process.env.NODE_PATH = srcPath;
require('module')._initPaths();

// Import our migration system
const migrations = require('../src/database/migrations');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    dryRun: args.includes('--dry-run'),
    rollback: args.includes('--rollback'),
    status: args.includes('--status'),
    version: null,
    dbPath: null
};

// Get target version if specified
const versionIndex = args.indexOf('--version');
if (versionIndex !== -1 && args[versionIndex + 1]) {
    options.version = parseInt(args[versionIndex + 1]);
}

// Get database path if specified
const dbPathIndex = args.indexOf('--db-path');
if (dbPathIndex !== -1 && args[dbPathIndex + 1]) {
    options.dbPath = args[dbPathIndex + 1];
}

async function showStatus() {
    try {
        console.log('📊 Database Migration Status');
        console.log('============================');

        const currentVersion = await migrations.getCurrentVersion();
        console.log(`Current Version: ${currentVersion}`);

        const history = await migrations.getMigrationHistory();

        if (history.length === 0) {
            console.log('No migrations have been executed yet.');
        } else {
            console.log('\nMigration History:');
            history.forEach(migration => {
                console.log(`  ✅ v${migration.version}: ${migration.name} (${migration.executedAt})`);
            });
        }

        // Show pending migrations
        const pendingMigrations = migrations.migrations.filter(m => m.version > currentVersion);
        if (pendingMigrations.length > 0) {
            console.log('\nPending Migrations:');
            pendingMigrations.forEach(migration => {
                console.log(`  ⏳ v${migration.version}: ${migration.name}`);
            });
        } else {
            console.log('\n✅ Database is up to date');
        }

    } catch (error) {
        console.error('❌ Error checking migration status:', error.message);
        process.exit(1);
    }
}

async function runMigrations() {
    try {
        console.log('🔄 Running Database Migrations');
        console.log('==============================');

        if (options.dryRun) {
            console.log('🔍 DRY RUN MODE - No changes will be made');

            const currentVersion = await migrations.getCurrentVersion();
            const pendingMigrations = migrations.migrations.filter(m => m.version > currentVersion);

            if (pendingMigrations.length === 0) {
                console.log('✅ No pending migrations');
                return;
            }

            console.log(`\nWould execute ${pendingMigrations.length} migrations:`);
            pendingMigrations.forEach(migration => {
                console.log(`  📝 v${migration.version}: ${migration.name}`);
                console.log(`     ${migration.description}`);
            });

            return;
        }

        await migrations.migrate();
        console.log('🎉 Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

async function runRollback() {
    try {
        console.log('🔄 Rolling Back Database');
        console.log('========================');

        if (options.dryRun) {
            console.log('🔍 DRY RUN MODE - No changes will be made');

            const currentVersion = await migrations.getCurrentVersion();
            const targetVersion = options.version || (currentVersion - 1);

            if (targetVersion >= currentVersion) {
                console.log('⚠️  No rollback needed');
                return;
            }

            const migrationsToRollback = migrations.migrations
                .filter(m => m.version > targetVersion && m.version <= currentVersion)
                .reverse();

            console.log(`\nWould rollback ${migrationsToRollback.length} migrations:`);
            migrationsToRollback.forEach(migration => {
                console.log(`  📝 v${migration.version}: ${migration.name}`);
            });

            return;
        }

        await migrations.rollback(options.version);
        console.log('🎉 Rollback completed successfully');

    } catch (error) {
        console.error('❌ Rollback failed:', error.message);
        process.exit(1);
    }
}

async function main() {
    console.log('🗄️  NutriStats Database Migration Tool');
    console.log('=====================================\n');

    // Determine database path
    let dbPath;
    if (options.dbPath) {
        dbPath = path.resolve(options.dbPath);
        console.log(`📍 Using custom database path: ${dbPath}`);

        // Set environment variable for the connection module
        process.env.DB_PATH = dbPath;
    } else {
        dbPath = path.join(__dirname, '..', 'src', 'data', 'nutrition_app.db');
        console.log(`📍 Using default database path: ${dbPath}`);
    }

    if (!fs.existsSync(dbPath)) {
        console.log('⚠️  Database file not found. Creating new database...');

        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    try {
        if (options.status) {
            await showStatus();
        } else if (options.rollback) {
            await runRollback();
        } else {
            await runMigrations();
        }
    } catch (error) {
        console.error('❌ Operation failed:', error.message);
        process.exit(1);
    }
}

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🗄️  NutriStats Database Migration Tool

Usage: node scripts/migrate-database.js [options]

Options:
  --status      Show current migration status
  --dry-run     Show what would be done without executing
  --rollback    Rollback to previous version
  --version N   Target version (for rollback)
  --db-path     Path to production database file
  --help, -h    Show this help message

Examples:
  node scripts/migrate-database.js --status
  node scripts/migrate-database.js --dry-run
  node scripts/migrate-database.js
  node scripts/migrate-database.js --rollback --version 1
  node scripts/migrate-database.js --db-path /path/to/production/nutrition_app.db
`);
    process.exit(0);
}

// Run the main function
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});