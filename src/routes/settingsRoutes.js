const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

// Ensure the data directory exists
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, '..', 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Initialize settings file if it doesn't exist
async function initializeSettingsFile() {
    try {
        await fs.access(SETTINGS_FILE);
    } catch {
        const defaultSettings = {
            unitSystem: 'metric',
            sex: 'male',
            age: 30,
            weight: 70,
            height: 170,
            activityLevel: '1.55',  // Default to moderate exercise
            calorieAdjustment: 0,
            mealInterval: 3,  // Default to 3 hours between meals
            bmr: 0,
            totalCalories: 0,
            weeklyCalories: 0
        };
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    }
}

// Get user settings
router.get('/', async (req, res) => {
    try {
        await ensureDataDirectory();
        await initializeSettingsFile();
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading settings:', error);
        res.status(500).json({ error: 'Failed to read settings' });
    }
});

// Update user settings
router.post('/', async (req, res) => {
    try {
        await ensureDataDirectory();
        const settings = req.body;
        
        // Validate required fields
        const requiredFields = ['sex', 'age', 'weight', 'height', 'activityLevel'];
        for (const field of requiredFields) {
            if (!settings[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        // Validate numeric fields
        const numericFields = ['age', 'weight', 'height', 'calorieAdjustment', 'bmr', 'totalCalories', 'mealInterval'];
        for (const field of numericFields) {
            if (settings[field] !== undefined) {
                settings[field] = parseFloat(settings[field]);
                if (isNaN(settings[field])) {
                    return res.status(400).json({ error: `Invalid numeric value for field: ${field}` });
                }
            }
        }

        // Validate meal interval
        if (settings.mealInterval < 1 || settings.mealInterval > 6) {
            return res.status(400).json({ error: 'Meal interval must be between 1 and 6 hours' });
        }

        await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        res.json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

module.exports = router; 