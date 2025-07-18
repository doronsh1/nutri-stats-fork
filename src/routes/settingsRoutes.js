const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { requireAuth, getUserSettingsPath, ensureUserDataDirectory } = require('../middleware/auth');

// Legacy settings file for backward compatibility during transition
const LEGACY_SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

// Ensure the data directory exists
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, '..', 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Initialize user-specific settings file if it doesn't exist
async function initializeUserSettingsFile(userSettingsFile) {
    try {
        await fs.access(userSettingsFile);
    } catch {
        const defaultSettings = {
            userName: '',  // Will be populated from user session
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
        await fs.writeFile(userSettingsFile, JSON.stringify(defaultSettings, null, 2));
    }
}

// Legacy function for backward compatibility
async function initializeSettingsFile() {
    try {
        await fs.access(LEGACY_SETTINGS_FILE);
    } catch {
        const defaultSettings = {
            userName: '',  // Will be populated from user session  
            unitSystem: 'metric',
            sex: 'male',
            age: 30,
            weight: 70,
            height: 170,
            activityLevel: '1.55',
            calorieAdjustment: 0,
            mealInterval: 3,
            bmr: 0,
            totalCalories: 0,
            weeklyCalories: 0
        };
        await fs.writeFile(LEGACY_SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    }
}

// Get user settings - user-specific with authentication
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        await ensureUserDataDirectory(userId);
        
        const userSettingsFile = getUserSettingsPath(userId);
        await initializeUserSettingsFile(userSettingsFile);
        
        const data = await fs.readFile(userSettingsFile, 'utf8');
        const settings = JSON.parse(data);
        
        // Ensure userName is populated from session data
        settings.userName = req.user.name || '';
        
        // Save the updated settings back to file if userName was added
        if (!data.includes('"userName"')) {
            await fs.writeFile(userSettingsFile, JSON.stringify(settings, null, 2));
        }
        
        res.json(settings);
    } catch (error) {
        console.error('Error reading user settings:', error);
        res.status(500).json({ error: 'Failed to read settings' });
    }
});

// Update user settings - user-specific with authentication
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        await ensureUserDataDirectory(userId);
        
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

        // Handle userName update - update both settings and user profile
        if (settings.userName && settings.userName !== req.user.name) {
            try {
                // Update user's name in users.json
                const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
                const usersData = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
                
                const userIndex = usersData.users.findIndex(user => user.id === userId);
                if (userIndex !== -1) {
                    usersData.users[userIndex].name = settings.userName;
                    await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));
                    
                    // Update session data
                    req.session.userName = settings.userName;
                }
            } catch (error) {
                console.error('Error updating user name:', error);
                // Continue with settings save even if name update fails
            }
        }

        const userSettingsFile = getUserSettingsPath(userId);
        await fs.writeFile(userSettingsFile, JSON.stringify(settings, null, 2));
        res.json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving user settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

module.exports = router; 