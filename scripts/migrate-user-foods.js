const { query, isDatabaseAvailable } = require('../src/database/connection');

async function migrateUserFoods() {
    if (!isDatabaseAvailable()) {
        console.error('❌ Database not available');
        return;
    }

    try {
        console.log('🔄 Starting user foods migration...');

        // Check if user_foods table exists
        const tableExists = await query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='user_foods'
        `);

        if (tableExists.rows.length === 0) {
            // Create user_foods table if it doesn't exist
            await query(`
                CREATE TABLE user_foods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    item TEXT NOT NULL,
                    amount TEXT,
                    calories REAL,
                    carbs REAL,
                    protein REAL,
                    protein_general REAL,
                    fat REAL,
                    is_custom BOOLEAN DEFAULT 1,
                    is_deleted BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ Created user_foods table');
        } else {
            // Check if is_deleted column exists
            const columnExists = await query(`
                PRAGMA table_info(user_foods)
            `);
            
            const hasIsDeleted = columnExists.rows.some(col => col.name === 'is_deleted');
            
            if (!hasIsDeleted) {
                // Add is_deleted column to existing table
                await query(`
                    ALTER TABLE user_foods 
                    ADD COLUMN is_deleted BOOLEAN DEFAULT 0
                `);
                console.log('✅ Added is_deleted column to user_foods table');
            }
        }

        console.log('✅ User foods migration completed successfully');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateUserFoods()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrateUserFoods;