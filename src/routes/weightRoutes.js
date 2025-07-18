const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { requireAuth, getUserDataPath, ensureUserDataDirectory } = require('../middleware/auth');

// Helper function to get user weight file path
function getUserWeightPath(userId) {
    return path.join(getUserDataPath(userId), 'weight.json');
}

// Initialize user weight file if it doesn't exist
async function initializeUserWeightFile(userWeightFile) {
    try {
        await fs.access(userWeightFile);
    } catch {
        const defaultWeightData = {
            entries: []
        };
        await fs.writeFile(userWeightFile, JSON.stringify(defaultWeightData, null, 2));
    }
}

// GET - Get all weight entries for a user
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        await ensureUserDataDirectory(userId);
        
        const userWeightFile = getUserWeightPath(userId);
        await initializeUserWeightFile(userWeightFile);
        
        const data = await fs.readFile(userWeightFile, 'utf8');
        const weightData = JSON.parse(data);
        
        // Sort entries by date (newest first)
        weightData.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json(weightData);
    } catch (error) {
        console.error('Error reading weight entries:', error);
        res.status(500).json({ error: 'Failed to read weight entries' });
    }
});

// POST - Add a new weight entry
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        await ensureUserDataDirectory(userId);
        
        const { date, weight, note } = req.body;
        
        // Validate required fields
        if (!date || !weight) {
            return res.status(400).json({ error: 'Date and weight are required' });
        }
        
        // Validate weight is a positive number
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            return res.status(400).json({ error: 'Weight must be a positive number' });
        }
        
        // Validate date format
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        
        const userWeightFile = getUserWeightPath(userId);
        await initializeUserWeightFile(userWeightFile);
        
        const data = await fs.readFile(userWeightFile, 'utf8');
        const weightData = JSON.parse(data);
        
        // Check if entry already exists for this date
        const existingEntryIndex = weightData.entries.findIndex(entry => entry.date === date);
        
        const newEntry = {
            id: Date.now().toString(),
            date: date,
            weight: weightNum,
            note: note || '',
            createdAt: new Date().toISOString()
        };
        
        if (existingEntryIndex !== -1) {
            // Update existing entry
            weightData.entries[existingEntryIndex] = { ...weightData.entries[existingEntryIndex], ...newEntry };
        } else {
            // Add new entry
            weightData.entries.push(newEntry);
        }
        
        await fs.writeFile(userWeightFile, JSON.stringify(weightData, null, 2));
        res.json({ message: 'Weight entry saved successfully', entry: newEntry });
    } catch (error) {
        console.error('Error saving weight entry:', error);
        res.status(500).json({ error: 'Failed to save weight entry' });
    }
});

// PUT - Update an existing weight entry
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const entryId = req.params.id;
        const { date, weight, note } = req.body;
        
        await ensureUserDataDirectory(userId);
        
        // Validate required fields
        if (!date || !weight) {
            return res.status(400).json({ error: 'Date and weight are required' });
        }
        
        // Validate weight is a positive number
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            return res.status(400).json({ error: 'Weight must be a positive number' });
        }
        
        const userWeightFile = getUserWeightPath(userId);
        await initializeUserWeightFile(userWeightFile);
        
        const data = await fs.readFile(userWeightFile, 'utf8');
        const weightData = JSON.parse(data);
        
        // Find the entry to update
        const entryIndex = weightData.entries.findIndex(entry => entry.id === entryId);
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Weight entry not found' });
        }
        
        // Update the entry
        weightData.entries[entryIndex] = {
            ...weightData.entries[entryIndex],
            date: date,
            weight: weightNum,
            note: note || '',
            updatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(userWeightFile, JSON.stringify(weightData, null, 2));
        res.json({ message: 'Weight entry updated successfully', entry: weightData.entries[entryIndex] });
    } catch (error) {
        console.error('Error updating weight entry:', error);
        res.status(500).json({ error: 'Failed to update weight entry' });
    }
});

// DELETE - Delete a weight entry
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const entryId = req.params.id;
        
        await ensureUserDataDirectory(userId);
        
        const userWeightFile = getUserWeightPath(userId);
        await initializeUserWeightFile(userWeightFile);
        
        const data = await fs.readFile(userWeightFile, 'utf8');
        const weightData = JSON.parse(data);
        
        // Find the entry to delete
        const entryIndex = weightData.entries.findIndex(entry => entry.id === entryId);
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Weight entry not found' });
        }
        
        // Remove the entry
        weightData.entries.splice(entryIndex, 1);
        
        await fs.writeFile(userWeightFile, JSON.stringify(weightData, null, 2));
        res.json({ message: 'Weight entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting weight entry:', error);
        res.status(500).json({ error: 'Failed to delete weight entry' });
    }
});

module.exports = router; 