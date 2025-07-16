const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const MEALS_DIR = path.join(__dirname, '..', 'data', 'meals');
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

// Ensure required directories exist
async function ensureDirectories() {
    try {
        // Create data and meals directories
        await fs.mkdir(path.join(__dirname, '..', 'data'), { recursive: true });
        await fs.mkdir(MEALS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
        throw error;
    }
}

// Helper function to load daily data
async function loadDailyData(date) {
    const filePath = getMealsFilePath(date);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading daily data:', error);
        throw error;
    }
}

// Helper function to save daily data
async function saveDailyData(date, data) {
    const filePath = getMealsFilePath(date);
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving daily data:', error);
        throw error;
    }
}

// Get meal times based on interval
async function getMealTimes() {
    try {
        const settingsData = await fs.readFile(SETTINGS_FILE, 'utf8');
        const settings = JSON.parse(settingsData);
        const interval = settings.mealInterval || 3; // Default to 3 hours if not set
        
        // Start at 8:00 AM
        const startHour = 8;
        const times = [];
        
        for (let i = 0; i < 6; i++) {
            const hour = startHour + (i * interval);
            const formattedHour = hour.toString().padStart(2, '0');
            times.push(`${formattedHour}:00`);
        }
        
        return times;
    } catch (error) {
        console.error('Error reading settings:', error);
        // Default times if settings can't be read
        return ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
    }
}

// Initialize all day files if they don't exist
async function initializeAllDayFiles() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const times = await getMealTimes();
    
    // Ensure meals directory exists
    try {
        await fs.access(MEALS_DIR);
    } catch {
        await fs.mkdir(MEALS_DIR, { recursive: true });
    }
    
    for (const day of days) {
        const filePath = path.join(MEALS_DIR, `${day}.json`);
        try {
            await fs.access(filePath);
            // If file exists, ensure it has the required fields
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
            if (!data.proteinLevel || !data.fatLevel) {
                data.proteinLevel = data.proteinLevel || 1.9;
                data.fatLevel = data.fatLevel || 0.8;
                data.calorieAdjustment = data.calorieAdjustment || 0;
                await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            }
        } catch (error) {
            // Create new file with default data
            const defaultMeals = {
                proteinLevel: 1.9, // Default to 1.9g/kg
                fatLevel: 0.8,     // Default to 0.8g/kg
                calorieAdjustment: 0,
                meals: times.map((time, index) => ({
                    id: index + 1,
                    time: time,
                    items: []
                }))
            };
            await fs.writeFile(filePath, JSON.stringify(defaultMeals, null, 2));
        }
    }
}

// Get meals file path for a specific day
function getMealsFilePath(dayName) {
    return path.join(MEALS_DIR, `${dayName.toLowerCase()}.json`);
}

// Get meals for a specific day
router.get('/:day', async (req, res) => {
    try {
        const day = req.params.day.toLowerCase();
        await ensureDirectories(); // Ensure directories exist
        await initializeAllDayFiles(); // This will ensure all day files exist with default data
        
        const filePath = getMealsFilePath(day);
        let data;
        
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            console.log(`Creating new file for ${day}`);
            // If file doesn't exist or is invalid, create with default data
            const times = await getMealTimes();
            data = {
                proteinLevel: 1.9,
                fatLevel: 0.8,
                calorieAdjustment: 0,
                meals: times.map((time, index) => ({
                    id: index + 1,
                    time: time,
                    items: []
                }))
            };
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error reading meals:', error);
        res.status(500).json({ error: 'Failed to read meals' });
    }
});

// Update meal time
router.put('/:day/meals/:mealId/time', async (req, res) => {
    try {
        const { day, mealId } = req.params;
        const { time } = req.body;
        
        const filePath = getMealsFilePath(day);
        const data = await fs.readFile(filePath, 'utf8');
        const mealsData = JSON.parse(data);
        
        const meal = mealsData.meals.find(m => m.id === parseInt(mealId));
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        meal.time = time;
        await fs.writeFile(filePath, JSON.stringify(mealsData, null, 2));
        
        res.json({ message: 'Meal time updated successfully' });
    } catch (error) {
        console.error('Error updating meal time:', error);
        res.status(500).json({ error: 'Failed to update meal time' });
    }
});

// Add item to meal for a specific day
router.post('/:day/meals/:mealId/items', async (req, res) => {
    try {
        const { day, mealId } = req.params;
        const newItem = req.body;
        
        const filePath = getMealsFilePath(day);
        const data = await fs.readFile(filePath, 'utf8');
        const mealsData = JSON.parse(data);
        
        const meal = mealsData.meals.find(m => m.id === parseInt(mealId));
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        // Generate new item ID
        const itemId = Math.max(0, ...meal.items.map(item => item.id || 0)) + 1;
        newItem.id = itemId;
        
        meal.items.push(newItem);
        await fs.writeFile(filePath, JSON.stringify(mealsData, null, 2));
        
        res.json(newItem);
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update item in meal for a specific day
router.put('/:day/meals/:mealId/items/:itemId', async (req, res) => {
    try {
        const { day, mealId, itemId } = req.params;
        const updatedItem = req.body;
        
        const filePath = getMealsFilePath(day);
        const data = await fs.readFile(filePath, 'utf8');
        const mealsData = JSON.parse(data);
        
        const meal = mealsData.meals.find(m => m.id === parseInt(mealId));
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        const itemIndex = meal.items.findIndex(item => item.id === parseInt(itemId));
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        updatedItem.id = parseInt(itemId);
        meal.items[itemIndex] = updatedItem;
        
        await fs.writeFile(filePath, JSON.stringify(mealsData, null, 2));
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete item from meal for a specific day
router.delete('/:day/meals/:mealId/items/:itemId', async (req, res) => {
    try {
        const { day, mealId, itemId } = req.params;
        
        const filePath = getMealsFilePath(day);
        const data = await fs.readFile(filePath, 'utf8');
        const mealsData = JSON.parse(data);
        
        const meal = mealsData.meals.find(m => m.id === parseInt(mealId));
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        const itemIndex = meal.items.findIndex(item => item.id === parseInt(itemId));
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        meal.items.splice(itemIndex, 1);
        await fs.writeFile(filePath, JSON.stringify(mealsData, null, 2));
        
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Update macro levels for a specific day
router.put('/:day/macros', async (req, res) => {
    try {
        const { day } = req.params;
        const { proteinLevel, fatLevel, calorieAdjustment } = req.body;
        
        const filePath = getMealsFilePath(day);
        let mealsData;
        
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            mealsData = JSON.parse(fileContent);
        } catch (error) {
            console.log(`Creating new file for ${day} during macro update`);
            // If file doesn't exist or is invalid, create with default data
            const times = await getMealTimes();
            mealsData = {
                proteinLevel: 1.9,
                fatLevel: 0.8,
                calorieAdjustment: 0,
                meals: times.map((time, index) => ({
                    id: index + 1,
                    time: time,
                    items: []
                }))
            };
        }
        
        // Update macro settings
        mealsData.proteinLevel = proteinLevel;
        mealsData.fatLevel = fatLevel;
        mealsData.calorieAdjustment = calorieAdjustment;
        
        await fs.writeFile(filePath, JSON.stringify(mealsData, null, 2));
        res.json({ message: 'Macro settings updated successfully' });
    } catch (error) {
        console.error('Error updating macro settings:', error);
        res.status(500).json({ error: 'Failed to update macro settings' });
    }
});

module.exports = router; 