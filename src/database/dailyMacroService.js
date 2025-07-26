const { query, isDatabaseAvailable } = require('./connection');

class DailyMacroService {
    constructor() {
        this.tableName = 'user_daily_macros';
    }

    // Get daily macro settings for a specific user and day
    async getDailyMacros(userId, dayName) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return this.getDefaultMacros();
        }

        try {
            const result = await query(
                'SELECT protein_level, fat_level, calorie_adjustment FROM user_daily_macros WHERE user_id = ? AND day = ?',
                [userId, dayName.toLowerCase()]
            );

            if (result.rows.length > 0) {
                const macros = result.rows[0];
                const macroData = {
                    proteinLevel: macros.protein_level || null,
                    fatLevel: macros.fat_level || null,
                    calorieAdjustment: macros.calorie_adjustment || 0
                };
                console.log(`🔍 DailyMacroService.getDailyMacros for ${dayName}:`, macroData);
                return macroData;
            } else {
                // Return default macros if no settings found for this day
                const defaults = this.getDefaultMacros();
                console.log(`🔍 DailyMacroService.getDailyMacros for ${dayName} (no data):`, defaults);
                return defaults;
            }
        } catch (error) {
            console.error('❌ Database error getting daily macros:', error.message);
            return this.getDefaultMacros();
        }
    }

    // Save daily macro settings for a specific user and day
    async saveDailyMacros(userId, dayName, macros) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            const { proteinLevel, fatLevel, calorieAdjustment } = macros;

            // Use INSERT OR REPLACE to handle both insert and update cases
            // This prevents UNIQUE constraint violations from duplicate requests
            await query(`
                INSERT OR REPLACE INTO user_daily_macros 
                (user_id, day, protein_level, fat_level, calorie_adjustment, created_at, updated_at)
                VALUES (
                    ?, 
                    ?, 
                    ?, 
                    ?, 
                    ?,
                    COALESCE((SELECT created_at FROM user_daily_macros WHERE user_id = ? AND day = ?), CURRENT_TIMESTAMP),
                    CURRENT_TIMESTAMP
                )
            `, [
                userId,
                dayName.toLowerCase(),
                proteinLevel,
                fatLevel,
                calorieAdjustment || 0,
                userId,
                dayName.toLowerCase()
            ]);

            console.log(`✅ Daily macros saved for user ${userId}, day ${dayName}: protein=${proteinLevel}, fat=${fatLevel}, calorie=${calorieAdjustment}`);
            return true;
        } catch (error) {
            console.error('❌ Database error saving daily macros:', error.message);
            return false;
        }
    }

    // Get default macro settings (empty for new users)
    getDefaultMacros() {
        return {
            proteinLevel: null, // null means no value set yet
            fatLevel: null,     // null means no value set yet
            calorieAdjustment: 0
        };
    }

    // Get storage method for debugging
    getStorageMethod() {
        return isDatabaseAvailable() ? 'SQLite Database' : 'Not Available';
    }
}

module.exports = new DailyMacroService(); 