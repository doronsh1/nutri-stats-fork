#!/usr/bin/env node

/**
 * Fixed Migration Script
 * 
 * This script fixes the timing issue with database availability checking
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Database path
const dbPath = path.join(__dirname, '..', 'src', 'data', 'nutrition_app.db');

console.log('🗄️  Fixed Database Migration Tool');
console.log('==================================');
console.log(`📍 Database path: ${dbPath}`);

// Direct database connection
function connectToDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('✅ Connected to database');
                resolve(db);
            }
        });
    });
}

// Query function
function query(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('INSERT') || 
            sql.trim().toUpperCase().startsWith('UPDATE') || 
            sql.trim().toUpperCase().startsWith('DELETE') ||
            sql.trim().toUpperCase().startsWith('CREATE')) {
            
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

// Migrations
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
        `
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
        `
    }
];

async function runMigrations() {
    let db;
    
    try {
        // Connect to database
        db = await connectToDatabase();
        
        // Create migration history table first
        console.log('📋 Creating migration history table...');
        await query(db, `
            CREATE TABLE IF NOT EXISTS migration_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Get current version
        const result = await query(db, `
            SELECT MAX(version) as current_version 
            FROM migration_history
        `);
        
        const currentVersion = result.rows[0]?.current_version || 0;
        console.log(`📊 Current database version: ${currentVersion}`);
        
        // Find pending migrations
        const pendingMigrations = migrations.filter(m => m.version > currentVersion);
        
        if (pendingMigrations.length === 0) {
            console.log('✅ Database is up to date');
            return;
        }
        
        console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);
        
        // Run each migration
        for (const migration of pendingMigrations) {
            console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);
            
            // Execute migration
            await query(db, migration.up);
            
            // Record migration
            await query(db, `
                INSERT INTO migration_history (version, name, description)
                VALUES (?, ?, ?)
            `, [migration.version, migration.name, migration.description]);
            
            console.log(`✅ Migration ${migration.version} completed`);
        }
        
        console.log('🎉 All migrations completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (db) {
            db.close();
        }
    }
}

// Run migrations
runMigrations();