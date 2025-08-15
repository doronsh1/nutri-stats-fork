#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes a new database with the required schema.
 * It's safe to run multiple times - it won't overwrite existing data.
 * 
 * Usage:
 *   node scripts/init-database.js [--db-path /path/to/db]
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
const dbPathIndex = args.indexOf('--db-path');
let dbPath;

if (dbPathIndex !== -1 && args[dbPathIndex + 1]) {
    dbPath = path.resolve(args[dbPathIndex + 1]);
    process.env.DB_PATH = dbPath;
} else {
    dbPath = path.join(__dirname, '..', 'src', 'data', 'nutrition_app.db');
}

async function initializeDatabase() {
    console.log('🗄️  Database Initialization');
    console.log('===========================');
    console.log(`📍 Database path: ${dbPath}`);

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        console.log('📁 Creating data directory...');
        fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
        // Check if database exists
        const dbExists = fs.existsSync(dbPath);
        
        if (dbExists) {
            console.log('✅ Database file already exists');
            
            // Check current version
            const currentVersion = await migrations.getCurrentVersion();
            console.log(`📊 Current database version: ${currentVersion}`);
            
            // Run any pending migrations
            const pendingMigrations = migrations.migrations.filter(m => m.version > currentVersion);
            if (pendingMigrations.length > 0) {
                console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);
                await migrations.migrate();
                console.log('✅ Migrations completed');
            } else {
                console.log('✅ Database is up to date');
            }
        } else {
            console.log('🆕 Creating new database...');
            
            // Run all migrations to create fresh database
            await migrations.migrate();
            console.log('✅ Database initialized successfully');
        }

        // Show final status
        const finalVersion = await migrations.getCurrentVersion();
        console.log(`🎉 Database ready! Version: ${finalVersion}`);

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    }
}

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🗄️  Database Initialization Script

Usage: node scripts/init-database.js [options]

Options:
  --db-path     Path to database file (optional)
  --help, -h    Show this help message

Examples:
  node scripts/init-database.js
  node scripts/init-database.js --db-path /path/to/nutrition_app.db
`);
    process.exit(0);
}

// Run initialization
initializeDatabase().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});