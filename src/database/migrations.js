const { query, isDatabaseAvailable } = require('./connection');

class DatabaseMigrations {
    constructor() {
        this.migrations = [
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
    }

    async checkDatabaseStatus() {
        const available = await isDatabaseAvailable();
        if (available) {
            console.log('🔄 Migration system using SQLite database');
            return true;
        } else {
            console.log('🚫 Migration database not available');
            return false;
        }
    }

    async getCurrentVersion() {
        try {
            // First ensure migration_history table exists
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
            console.error('❌ Error getting current migration version:', error.message);
            return 0;
        }
    }

    async runMigration(migration) {
        try {
            console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);

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

    async migrate() {
        if (!await this.checkDatabaseStatus()) {
            throw new Error('Database not available for migrations');
        }

        try {
            const currentVersion = await this.getCurrentVersion();
            console.log(`📊 Current database version: ${currentVersion}`);

            const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);

            if (pendingMigrations.length === 0) {
                console.log('✅ Database is up to date');
                return;
            }

            console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);

            for (const migration of pendingMigrations) {
                await this.runMigration(migration);
            }

            console.log('🎉 All migrations completed successfully');
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }

    async rollback(targetVersion = null) {
        if (!await this.checkDatabaseStatus()) {
            throw new Error('Database not available for rollback');
        }

        try {
            const currentVersion = await this.getCurrentVersion();
            const rollbackTo = targetVersion || (currentVersion - 1);

            if (rollbackTo >= currentVersion) {
                console.log('⚠️  No rollback needed');
                return;
            }

            const migrationsToRollback = this.migrations
                .filter(m => m.version > rollbackTo && m.version <= currentVersion)
                .reverse(); // Rollback in reverse order

            console.log(`🔄 Rolling back ${migrationsToRollback.length} migrations...`);

            for (const migration of migrationsToRollback) {
                console.log(`🔄 Rolling back migration ${migration.version}: ${migration.name}`);

                // Execute rollback
                await query(migration.down);

                // Remove from history
                await query(`
                    DELETE FROM migration_history 
                    WHERE version = ?
                `, [migration.version]);

                console.log(`✅ Migration ${migration.version} rolled back successfully`);
            }

            console.log('🎉 Rollback completed successfully');
        } catch (error) {
            console.error('❌ Rollback failed:', error.message);
            throw error;
        }
    }

    async getMigrationHistory() {
        try {
            const result = await query(`
                SELECT * FROM migration_history 
                ORDER BY version ASC
            `);

            return result.rows.map(row => ({
                version: row.version,
                name: row.name,
                description: row.description,
                executedAt: row.executed_at
            }));
        } catch (error) {
            console.error('❌ Error getting migration history:', error.message);
            return [];
        }
    }
}

module.exports = new DatabaseMigrations();