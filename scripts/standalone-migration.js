#!/usr/bin/env node

/**
 * Standalone Database Migration Script
 * 
 * This script contains all necessary code to run migrations without
 * requiring the full application structure.
 * 
 * Usage:
 *   node standalone-migration.js [database-path] [options]
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const dbPath = args[0] || './nutrition_app.db';
const isDryRun = args.includes('--dry-run');
const showStatus = args.includes('--status');

// Migration definitions
const migrations = [
    {
        version: 1,
        name: 'create_measurements_table',
        description: 'Create measurements tracking table',
        up: `
            CREATE TABLE IF NOT EXISTS user_measurements (
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
        `,
        down: `DROP TABLE IF EXISTS user_measurements;`
    },
    {
        version: 2,
        name: 'create_migration_history',
        description: 'Create migration history table',
        up: `
            CREATE TABLE IF NOT EXISTS migration_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `,
        down: `DROP TABLE IF EXISTS migration_history;`
    }
];

// Database connection
let db = null;

function connectToDatabase(dbPath) {
    return new Promise((resolve, reject) => {
        const resolvedPath = path.resolve(dbPath);
        
        // Ensure directory exists
        const dbDir = path.dirname(resolvedPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        db = new sqlite3.Database(resolvedPath, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log(`✅ Connected to database: ${resolvedPath}`);
                resolve(db);
            }
        });
    });
}

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('INSERT') || 
            sql.trim().toUpperCase().startsWith('UPDATE') || 
            sql.trim().toUpperCase().startsWith('DELETE')) {
            
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ 
                        rows: [], 
                        lastInsertRowid: this.lastID,
                        changes: this.changes 
                    });
                }
            });
        } else {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ rows });
                }
            });
        }
    });
}

async function getCurrentVersion() {
    try {
        // Ensure migration_history table exists
        await query(`
            CREATE TABLE IF NOT EXISTS migration_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const result = await query(`
            SELECT MAX(version) as current_version 
            FROM migration_history
        `);

        return result.rows[0]?.current_version || 0;
    } catch (error) {
        console.error('❌ Error getting current version:', error.message);
        return 0;
    }
}

async function getMigrationHistory() {
    try {
        const result = await query(`
            SELECT * FROM migration_history 
            ORDER BY version ASC
        `);

        return result.rows;
    } catch (error) {
        console.error('❌ Error getting migration history:', error.message);
        return [];
    }
}

async function runMigration(migration) {
    try {
        console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);

        if (isDryRun) {
            console.log(`   📝 Would execute: ${migration.description}`);
            return true;
        }

        // Execute the migration
        await query(migration.up);

        // Record the migration
        await query(`
            INSERT INTO migration_history (version, name, description)
            VALUES (?, ?, ?)
        `, [migration.version, migration.name, migration.description]);

        console.log(`✅ Migration ${migration.version} completed successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error.message);
        throw error;
    }
}

async function showMigrationStatus() {
    console.log('📊 Database Migration Status');
    console.log('============================');
    
    const currentVersion = await getCurrentVersion();
    console.log(`Current Version: ${currentVersion}`);
    
    const history = await getMigrationHistory();
    
    if (history.length === 0) {
        console.log('No migrations have been executed yet.');
    } else {
        console.log('\nMigration History:');
        history.forEach(migration => {
            console.log(`  ✅ v${migration.version}: ${migration.name} (${migration.executed_at})`);
        });
    }
    
    // Show pending migrations
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    if (pendingMigrations.length > 0) {
        console.log('\nPending Migrations:');
        pendingMigrations.forEach(migration => {
            console.log(`  ⏳ v${migration.version}: ${migration.name}`);
        });
    } else {
        console.log('\n✅ Database is up to date');
    }
}

async function runMigrations() {
    const currentVersion = await getCurrentVersion();
    console.log(`📊 Current database version: ${currentVersion}`);

    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
        console.log('✅ Database is up to date');
        return;
    }

    if (isDryRun) {
        console.log(`🔍 DRY RUN - Would execute ${pendingMigrations.length} migrations:`);
    } else {
        console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);
    }

    for (const migration of pendingMigrations) {
        await runMigration(migration);
    }

    if (!isDryRun) {
        console.log('🎉 All migrations completed successfully');
    }
}

async function main() {
    console.log('🗄️  Standalone Database Migration Tool');
    console.log('=====================================\n');
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Usage: node standalone-migration.js [database-path] [options]

Arguments:
  database-path    Path to SQLite database file (default: ./nutrition_app.db)

Options:
  --status         Show current migration status
  --dry-run        Show what would be done without executing
  --help, -h       Show this help message

Examples:
  node standalone-migration.js --status
  node standalone-migration.js /path/to/production.db --dry-run
  node standalone-migration.js /path/to/production.db
`);
        return;
    }

    try {
        console.log(`📍 Database path: ${path.resolve(dbPath)}`);
        
        await connectToDatabase(dbPath);
        
        if (showStatus) {
            await showMigrationStatus();
        } else {
            await runMigrations();
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (db) {
            db.close();
        }
    }
}

main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});