const { query, isDatabaseAvailable } = require('./connection');

class FoodService {
    constructor() {
        this.usingDatabase = false;
        // Wait a moment for database to initialize, then check status
        setTimeout(() => this.checkDatabaseStatus(), 300);
    }

    // Check database status on startup
    async checkDatabaseStatus() {
        this.usingDatabase = isDatabaseAvailable();
        if (this.usingDatabase) {
            console.log('🗄️  Food service using SQLite database');
        } else {
            console.log('🚫 Database not available');
        }
    }

    // Get all foods for a specific user (combines global + user-specific foods)
    async getAllFoods(userId = null) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return [];
        }

        try {
            let foods = [];

            if (userId) {
                // Get user-specific foods first
                const userFoods = await query(`
                    SELECT *, 'user' as source FROM user_foods 
                    WHERE user_id = ? 
                    ORDER BY item
                `, [userId]);

                // Get global foods that user hasn't customized
                const globalFoods = await query(`
                    SELECT *, 'global' as source FROM foods 
                    WHERE item NOT IN (
                        SELECT item FROM user_foods WHERE user_id = ?
                    )
                    ORDER BY item
                `, [userId]);

                // Combine user foods and global foods
                foods = [...userFoods.rows, ...globalFoods.rows];
            } else {
                // Fallback: return only global foods if no userId provided
                const result = await query('SELECT *, "global" as source FROM foods ORDER BY item');
                foods = result.rows;
            }

            return foods.map(row => ({
                id: row.id,
                item: row.item,
                amount: row.amount,
                calories: row.calories,
                carbs: row.carbs,
                protein: row.protein,
                proteinGeneral: row.protein_general,
                fat: row.fat,
                source: row.source,
                isCustom: row.source === 'user'
            }));
        } catch (error) {
            console.error('❌ Database error:', error.message);
            return [];
        }
    }

    // Search foods for a specific user (user foods take priority)
    async searchFoods(searchTerm, userId = null) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return [];
        }

        try {
            let foods = [];

            if (userId) {
                // Search user-specific foods first (including custom and modified foods)
                const userFoods = await query(`
                    SELECT *, 'user' as source FROM user_foods 
                    WHERE user_id = ? AND item LIKE ? AND (is_deleted IS NULL OR is_deleted = 0)
                    ORDER BY item
                    LIMIT 25
                `, [userId, `%${searchTerm}%`]);

                // Search global foods that user hasn't customized or deleted
                const globalFoods = await query(`
                    SELECT *, 'global' as source FROM foods 
                    WHERE item LIKE ? AND item NOT IN (
                        SELECT item FROM user_foods 
                        WHERE user_id = ? AND (is_deleted IS NULL OR is_deleted = 0)
                    )
                    ORDER BY item
                    LIMIT 25
                `, [`%${searchTerm}%`, userId]);

                // Combine user foods (priority) and global foods
                foods = [...userFoods.rows, ...globalFoods.rows];
            } else {
                // Fallback: search only global foods if no userId
                const result = await query(`
                    SELECT *, 'global' as source FROM foods 
                    WHERE item LIKE ? 
                    ORDER BY item
                    LIMIT 50
                `, [`%${searchTerm}%`]);
                foods = result.rows;
            }

            return foods.map(row => ({
                id: row.id,
                item: row.item,
                amount: row.amount,
                calories: row.calories,
                carbs: row.carbs,
                protein: row.protein,
                proteinGeneral: row.protein_general,
                fat: row.fat,
                source: row.source,
                isCustom: row.source === 'user'
            }));
        } catch (error) {
            console.error('❌ Database search error:', error.message);
            return [];
        }
    }

    // Add new food (always goes to user's personal foods)
    async addFood(foodData, userId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        if (!userId) {
            console.error('❌ User ID required for adding food');
            return false;
        }

        try {
            await query(`
                INSERT INTO user_foods (user_id, item, amount, calories, carbs, protein, protein_general, fat, is_custom)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [
                userId,
                foodData.item,
                foodData.amount,
                foodData.calories,
                foodData.carbs,
                foodData.protein,
                foodData.proteinGeneral,
                foodData.fat
            ]);
            console.log('✅ Food added to user database:', foodData.item, 'for user:', userId);
            return true;
        } catch (error) {
            console.error('❌ Database insert error:', error.message);
            return false;
        }
    }

    // Update food by index (Copy-on-Write approach)
    async updateFood(index, foodData, userId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        if (!userId) {
            console.error('❌ User ID required for updating food');
            return false;
        }

        try {
            // Get all foods for this user to find the target food
            const allFoods = await this.getAllFoods(userId);
            if (index < 0 || index >= allFoods.length) {
                console.error('Invalid index for update:', index);
                return false;
            }

            const targetFood = allFoods[index];

            if (targetFood.source === 'user') {
                // Update existing user food
                await query(`
                    UPDATE user_foods 
                    SET item = ?, amount = ?, calories = ?, carbs = ?, protein = ?, protein_general = ?, fat = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND user_id = ?
                `, [
                    foodData.item,
                    foodData.amount,
                    foodData.calories,
                    foodData.carbs,
                    foodData.protein,
                    foodData.proteinGeneral,
                    foodData.fat,
                    targetFood.id,
                    userId
                ]);
                console.log('✅ User food updated:', foodData.item);
            } else {
                // Copy-on-Write: Create user-specific version of global food
                await query(`
                    INSERT INTO user_foods (user_id, item, amount, calories, carbs, protein, protein_general, fat, is_custom)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                `, [
                    userId,
                    foodData.item,
                    foodData.amount,
                    foodData.calories,
                    foodData.carbs,
                    foodData.protein,
                    foodData.proteinGeneral,
                    foodData.fat
                ]);
                console.log('✅ Global food copied and modified for user:', foodData.item, 'User:', userId);
            }

            return true;
        } catch (error) {
            console.error('❌ Database update error:', error.message);
            return false;
        }
    }

    // Delete food by index (soft delete for global foods, hard delete for user foods)
    async deleteFood(index, userId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        if (!userId) {
            console.error('❌ User ID required for deleting food');
            return false;
        }

        try {
            // Get all foods for this user to find the target food
            const allFoods = await this.getAllFoods(userId);
            if (index < 0 || index >= allFoods.length) {
                console.error('Invalid index for delete:', index);
                return false;
            }

            const targetFood = allFoods[index];

            if (targetFood.source === 'user') {
                // Hard delete: Remove user's custom food completely
                await query(`
                    DELETE FROM user_foods 
                    WHERE id = ? AND user_id = ?
                `, [targetFood.id, userId]);
                console.log('✅ User custom food deleted:', targetFood.item);
            } else {
                // Soft delete: Mark global food as deleted for this user
                await query(`
                    INSERT INTO user_foods (user_id, item, amount, calories, carbs, protein, protein_general, fat, is_custom, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
                `, [
                    userId,
                    targetFood.item,
                    targetFood.amount,
                    targetFood.calories,
                    targetFood.carbs,
                    targetFood.protein,
                    targetFood.proteinGeneral,
                    targetFood.fat
                ]);
                console.log('✅ Global food hidden for user:', targetFood.item, 'User:', userId);
            }

            return true;
        } catch (error) {
            console.error('❌ Database delete error:', error.message);
            return false;
        }
    }

    // Get current storage method
    getStorageMethod() {
        return isDatabaseAvailable() ? 'SQLite Database' : 'No Storage Available';
    }
}

module.exports = new FoodService();